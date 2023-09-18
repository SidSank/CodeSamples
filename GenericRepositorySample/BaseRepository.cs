using CO.Core.Dtos.PagingAndSorting;
using CO.Core.ViewModels;
using CO.Enums;
using CO.GenericRepositories.Extensions;
using CO.GenericRepositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace CO.GenericRepositories
{
    public class BaseRepository<TEntity, TDbContext> : IBaseRepository<TEntity, TDbContext>
    where TEntity : BaseEntity
    where TDbContext : DbContext
    {
        protected bool UseCache;
        protected readonly ICacheService? CacheService;
        protected string CacheAllEntitiesKey = $"{typeof(TEntity)}";

        protected TDbContext DbContext;
        protected DbSet<TEntity> DbSet;

        #region constructor

        public BaseRepository(TDbContext dbContext, ICacheService? cacheService = null)
        {
            if (cacheService != null)
            {
                UseCache = true;
            }

            CacheService = cacheService;
            DbContext = dbContext;

            DbSet = DbContext.Set<TEntity>();
        }

        #endregion

        protected virtual object? GetKeyValue(TEntity item)
        {
            return null;
        }
        protected virtual IList<TEntity> FilterData(IList<TEntity> list, object keyValue)
        {
            throw new NotImplementedException();
        }

        #region Create

        public virtual async Task<TEntity> CreateAsync(TEntity model, bool saveChanges = true)
        {
            _ = await DbContext.AddAsync(model);

            if (saveChanges)
            {
                await SaveDbChangesAsync();
                AddToCache(model);
            }

            return model;
        }

        public virtual async Task<List<TEntity>> CreateRangeAsync(List<TEntity> models, bool saveChanges = true)
        {
            await DbContext.AddRangeAsync(models);

            if (saveChanges)
            {
                await SaveDbChangesAsync();
                AddToCache(models);
            }

            return models;
        }

        #endregion

        #region Update

        public virtual async Task<TEntity> UpdateAsync(TEntity entityToUpdate, bool saveChanges = true)
        {
            if (entityToUpdate == null)
            {
                throw new ArgumentNullException("entity");
            }

            if (DbContext.Entry(entityToUpdate).State == EntityState.Detached)
            {
                DbSet.Attach(entityToUpdate);
            }

            DbContext.Entry(entityToUpdate).State = EntityState.Modified;

            if (saveChanges)
            {
                await SaveDbChangesAsync();
                AddToCache(entityToUpdate);
            }
            return entityToUpdate;
        }

        #endregion

        #region Delete

        public virtual async Task<bool> DeleteAsync(TEntity entityToDelete, bool saveChanges = true)
        {
            if (DbContext.Entry(entityToDelete).State == EntityState.Detached)
            {
                DbSet.Attach(entityToDelete);
            }

            PreDeleteCommandCommonSettings(DbSet, entityToDelete);

            if (saveChanges)
            {
                await SaveDbChangesAsync();
                DeleteFromCacheIfExist(entityToDelete);
            }

            return true;
        }

        #endregion

        #region Get
        public virtual async Task<TEntity?> FindAsync(object id, params string[]? includeRelatedObjects)
        {
            return await DbSet.FindAsync(id);
            //throw new NotImplementedException();
        }
        public virtual async Task<TEntity?> FindAsync(object id)
        {
            return await DbSet.FindAsync(id);
        }
        public async Task<IList<TEntity>> GetAllAsync(Expression<Func<TEntity, bool>>? filter, params string[]? includeRelatedObjects)
        {
            var query = FormBaseQuery(filter, includeRelatedObjects);
            query = PreGetCommandCommonFilters(query);

            return await query.ToArrayAsync();
        }
        public virtual async Task<IList<TEntity>> GetAllAsync()
        {
            if (TryGetFromCache(CacheAllEntitiesKey, out IList<TEntity>? cachedList))
            {
                if (cachedList != null)
                {
                    return cachedList;
                }
            }

            var query = DbSet.AsNoTracking().AsQueryable();

            query = PreGetCommandCommonFilters(query);

            var entities = await query.ToArrayAsync();

            SetCache(CacheAllEntitiesKey, entities.ToList());

            return entities;
        }
        protected IQueryable<TEntity> AddOrderByExpression(IQueryable<TEntity> query, Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>>? orderBy = null)
        {
            if (orderBy != null)
            {
                query = orderBy(query);
            }
            return query;
        }
        protected IQueryable<TEntity> AddOrderByExpression(IQueryable<TEntity> query, List<SortType>? orderBy = null)
        {
            if (orderBy != null)
            {
                for (var index = 0; index < orderBy.Count; index++)
                {
                    query = AddOrderByExpression(query, orderBy[index]);
                }
            }
            return query;
        }
        protected IQueryable<TEntity> AddOrderByExpression(IQueryable<TEntity> query, SortType? orderBy = null, int sortColumnIndex = 0)
        {
            if (orderBy != null)
            {
                if (!string.IsNullOrWhiteSpace(orderBy.SortColumn))
                {
                    bool isAscending = orderBy.SortDirection.Equals(SortDirection.Ascending);
                    query = query.OrderBy(columnName: orderBy.SortColumn, isAscending: isAscending, sortColumnIndex: sortColumnIndex);
                }
            }
            return query;
        }
        protected IQueryable<TEntity> AddPagingExpression(IQueryable<TEntity> query, int? pageNumber = null, int? pageSize = null)
        {
            if (pageNumber != null && pageSize != null)
            {
                pageNumber = pageNumber > 0 ? pageNumber - 1 : 0;
                query = query.Skip((pageNumber.Value) * pageSize.Value);
            }

            if (pageSize != null)
            {
                query = query.Take(pageSize.Value);
            }
            return query;
        }
        protected virtual IQueryable<TEntity> FormBaseQuery(Expression<Func<TEntity, bool>>? filter = null, params string[]? includeRelatedObjects)
        {
            var query = DbSet.AsNoTracking().AsQueryable();

            if (includeRelatedObjects?.Length > 0)
            {
                query = includeRelatedObjects.Aggregate(query, (current, include) => current.Include(include));
            }

            if (filter != null)
            {
                query = query.Where(filter);
            }

            return query;
        }
        protected virtual IQueryable<TEntity> AddFilter(IQueryable<TEntity> query, Expression<Func<TEntity, bool>> filter)
        {
            query = query.Where(filter);
            return query;
        }

        public virtual async Task<IList<TEntity>> GetAllAsync(
            Expression<Func<TEntity, bool>>? filter = null,
            Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>>? orderBy = null,
            int? pageNumber = null, int? pageSize = null,
            params string[]? includeRelatedObjects)
        {
            var query = FormBaseQuery(filter, includeRelatedObjects);
            query = AddOrderByExpression(query, orderBy);
            query = AddPagingExpression(query, pageNumber, pageSize);

            query = PreGetCommandCommonFilters(query);

            return await query.ToArrayAsync();
        }

        public virtual async Task<IList<TEntity>> GetAllAsync(
            Expression<Func<TEntity, bool>>? filter = null,
            List<SortType>? orderBy = null,
            int? pageNumber = null, int? pageSize = null,
            params string[]? includeRelatedObjects)
        {
            var query = FormBaseQuery(filter, includeRelatedObjects);
            query = AddOrderByExpression(query, orderBy);
            query = AddPagingExpression(query, pageNumber, pageSize);
            query = PreGetCommandCommonFilters(query);


            return await query.ToArrayAsync();
        }

        #endregion

        #region First/ FirstOrDefault
        private IQueryable<TEntity> CreateFirstQuery(Expression<Func<TEntity, bool>>? filter = null, params string[]? includeRelatedObjects)
        {
            var query = DbSet.AsNoTracking().AsQueryable();

            if (includeRelatedObjects != null)
            {
                query = includeRelatedObjects.Aggregate(query, (current, include) => current.Include(include));
            }

            if (filter != null)
            {
                query = query.Where(filter);
            }

            query = PreGetCommandCommonFilters(query);
            return query;
        }
        public async Task<TEntity> FirstAsync(Expression<Func<TEntity, bool>>? filter = null, params string[]? includeRelatedObjects)
        {
            var query = CreateFirstQuery(filter, includeRelatedObjects);
            return await query.FirstAsync();
        }
        public async Task<TEntity?> FirstOrDefaultAsync(Expression<Func<TEntity, bool>>? filter = null, params string[]? includeRelatedObjects)
        {
            var query = DbSet.AsNoTracking().AsQueryable();

            if (includeRelatedObjects != null)
            {
                query = includeRelatedObjects.Aggregate(query, (current, include) => current.Include(include));
            }

            if (filter != null)
            {
                query = query.Where(filter);
            }

            query = PreGetCommandCommonFilters(query);

            return await query.FirstOrDefaultAsync();
        }

        public async Task<TEntity?> FirstOrDefaultAsync(Expression<Func<TEntity, bool>>? filter = null,
            List<SortType>? orderBy = null,
            params string[]? includeRelatedObjects)
        {
            var query = DbSet.AsNoTracking().AsQueryable();

            if (includeRelatedObjects != null)
            {
                query = includeRelatedObjects.Aggregate(query, (current, include) => current.Include(include));
            }
            query = AddOrderByExpression(query, orderBy);

            if (filter != null)
            {
                query = query.Where(filter);
            }

            query = PreGetCommandCommonFilters(query);

            return await query.FirstOrDefaultAsync();
        }

        #endregion

        #region Exist

        public virtual async Task<bool> ExistAsync(Expression<Func<TEntity, bool>> filter)
        {
            var query = DbSet.AsNoTracking().AsQueryable();
            query = query.Where(filter);

            query = PreGetCommandCommonFilters(query);

            return await query.AnyAsync();
        }

        #endregion

        #region Caching

        protected void AddToCache(List<TEntity> items)
        {
            if (!UseCache)
            {
                return;
            }

            items.ForEach(AddToCache);
        }

        protected void AddToCache(TEntity item)
        {
            if (!UseCache || CacheService == null)
            {
                return;
            }

            DeleteFromCacheIfExist(item);

            var keyValue = GetKeyValue(item);
            if (keyValue == null)
            {
                return;
            }
            SetCache(GetCacheKeyForIndividualEntity(keyValue), item);

            if (!CacheService.TryGet(CacheAllEntitiesKey, out List<TEntity> cachedList))
            {
                return;
            }

            cachedList.Add(item);

            SetCache(CacheAllEntitiesKey, cachedList);
        }

        protected void DeleteFromCacheIfExist(TEntity item)
        {
            if (!UseCache || CacheService == null)
            {
                return;
            }
            var keyValue = GetKeyValue(item);
            if (keyValue == null)
            {
                return;
            }

            CacheService.Remove(GetCacheKeyForIndividualEntity(keyValue));

            if (!CacheService.TryGet(CacheAllEntitiesKey, out IList<TEntity> cachedList))
            {
                return;
            }

            var cachedItem = FilterData(cachedList, keyValue).FirstOrDefault();

            if (cachedItem == null)
            {
                return;
            }

            cachedList.Remove(cachedItem);

            SetCache(CacheAllEntitiesKey, cachedList);
        }

        protected bool TryGetFromCache<TCacheType>(string cacheKey, out TCacheType? cacheData)
        {
            if (!UseCache && CacheService != null)
            {
                if (CacheService.TryGet(cacheKey, out cacheData))
                {
                    return true;
                }
            }

            cacheData = default;
            return false;
        }

        protected void SetCache<TCacheType>(string cacheKey, TCacheType item)
        {
            if (!UseCache || item is { } || CacheService == null)
            {
                return;
            }

            CacheService.Set(cacheKey, item);
        }

        // ReSharper disable once UnusedMember.Global
        protected async Task RefreshCacheAsync()
        {
            if (!UseCache || CacheService == null)
            {
                return;
            }

            CacheService.Remove(CacheAllEntitiesKey);

            _ = await GetAllAsync();
        }

        // ReSharper disable once UnusedMember.Global
        protected async Task RefreshCacheAsync(object id)
        {
            if (!UseCache || CacheService == null)
            {
                return;
            }

            string cacheKey = GetCacheKeyForIndividualEntity(id);
            CacheService.Remove(cacheKey);

            _ = await FindAsync(id);
        }

        #endregion Caching

        #region protected virtual methods

        protected virtual void PreDeleteCommandCommonSettings(DbSet<TEntity> dbSet, TEntity entityToDelete)
        {
            dbSet.Remove(entityToDelete);
        }

        protected virtual IQueryable<TEntity> PreGetCommandCommonFilters(IQueryable<TEntity> query)
        {
            return query;
        }

        protected async Task SaveDbChangesAsync()
        {
            await DbContext.SaveChangesAsync();
        }

        protected string GetCacheKeyForIndividualEntity(object id)
        {
            return $"{CacheAllEntitiesKey}_{id}";
        }

        #endregion protected methods

        #region SQL
        /// <summary>
        /// Complete sql string is required to run, including 'Exec'
        /// </summary>
        /// <param name="sql"></param>
        /// <returns></returns>
        public virtual async Task<IList<TEntity>> ExecuteSqlAsync(string sql)
        {
            var result = DbSet.FromSqlRaw("EXEC " + sql).IgnoreQueryFilters().AsNoTracking();

            var data = result.AsEnumerable().AsQueryable();

            return await data.ToArrayAsync();
        }
        /// <summary>
        /// Complete sql string is required to run including 'Exec'
        /// </summary>
        /// <param name="sql"></param>
        /// <param name="parameters"></param>
        /// <returns></returns>        
        public virtual async Task<IList<TEntity>> ExecuteSqlAsync(string sql, params object[] parameters)
        {
            var result = DbSet.FromSqlRaw(sql, parameters).IgnoreQueryFilters().AsNoTracking();

            var data = result.AsEnumerable().AsQueryable();

            return await data.ToArrayAsync();
        }
        #endregion
    }
}
