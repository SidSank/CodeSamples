using CO.Core.Dtos.PagingAndSorting;
using CO.Core.ViewModels;
using CO.EF.Models;
using CO.GenericRepositories;
using CO.GenericRepositories.Interfaces;
using CO.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace CO.Repositories.Repositories
{
    public class ProspectRepository : BaseRepository<Prospect, FocusedDbContext>, IProspectRepository
    {
        public ProspectRepository(FocusedDbContext dbcontext, ICacheService? cacheService = null)
            : base(dbcontext, cacheService)
        {
        }
        public async Task<PagedList<ProspectListViewModel>> GetAllAsync(ProspectSearchViewModel searchViewModel, int userId, bool getAllProspects = false)
        {

            var query = FormBaseQuery(null, nameof(Prospect.Status), nameof(Prospect.Company));

            if (!string.IsNullOrWhiteSpace(searchViewModel?.CompanyName))
            {
                query = AddFilter(query, filter: (prospect) => prospect.CompanyName.Contains(searchViewModel.CompanyName));
            }
            if (!string.IsNullOrWhiteSpace(searchViewModel?.Address1))
            {
                query = AddFilter(query, filter: (prospect) => prospect.Address.Any(a => a.Address1.Contains(searchViewModel.Address1)));
            }
            if (!string.IsNullOrWhiteSpace(searchViewModel?.Address2))
            {
                query = AddFilter(query, (prospect) => prospect.Address.Any(a => a.Address2.Contains(searchViewModel.Address2)));
            }
            if (!string.IsNullOrWhiteSpace(searchViewModel?.City))
            {
                query = AddFilter(query, (prospect) => prospect.Address.Any(a => a.City.Contains(searchViewModel.City)));
            }
            if (!string.IsNullOrWhiteSpace(searchViewModel?.State))
            {
                query = AddFilter(query, (prospect) => prospect.Address.Any(a => a.State.Contains(searchViewModel.State)));
            }
            if (!string.IsNullOrWhiteSpace(searchViewModel?.Zipcode))
            {
                query = AddFilter(query, (prospect) => prospect.Address.Any(a => a.Zip.Contains(searchViewModel.Zipcode)));
            }
            if (!string.IsNullOrWhiteSpace(searchViewModel?.ContactEmail))
            {
                query = AddFilter(query, (prospect) => prospect.Contact.Any(c => c.Email.Contains(searchViewModel.ContactEmail)));
            }
            if (!string.IsNullOrWhiteSpace(searchViewModel?.ContactPhoneNumber))
            {
                query = AddFilter(query, (prospect) => prospect.Contact.Any(x => x.PhoneNumber.Contains(searchViewModel.ContactPhoneNumber)));
            }
            if (!string.IsNullOrWhiteSpace(searchViewModel?.ContactName))
            {
                query = AddFilter(query, (prospect) => prospect.Contact.Any(d => d.ContactName.Contains(searchViewModel.ContactName)));
            }
            if (!getAllProspects)
            {
                query = AddFilter(query, (prospect) => (prospect.SalesStaffId != null && prospect.SalesStaffId == userId)
                || (prospect.CreatedById != null && prospect.CreatedById == userId)
                || (prospect.ModifiedById != null && prospect.ModifiedById == userId));
            }

            if (searchViewModel?.SortTypes == null || searchViewModel?.SortTypes.Any() == false)
            {
                var sortType = new SortType { SortColumn = nameof(Prospect.ModifiedTimeUtc), SortDirection = Enums.SortDirection.Descending };
                query = AddOrderByExpression(query, sortType, 0);
            }
            else
            {
                query = AddOrderByExpression(query, searchViewModel?.SortTypes);
            }
            var totalItemsCount = query.Count();

            query = AddPagingExpression(query, searchViewModel?.PageNumber, searchViewModel?.PageSize);



            //TODO: only paged data needs to pick from the database
            var items = await query.Select(s => new ProspectListViewModel
            {
                Id = s.Id,
                CompanyName = s.CompanyName,
                CompanyId = s.Company.Select(x => x.Id).FirstOrDefault(),
                CompanyOwner = s.CompanyOwner,
                PhoneNumber = s.PhoneNumber,
                CreatedTimeUtc = s.CreatedTimeUtc,
                StatusName = s.Status.StatusName,
                StatusId = s.Status.Id,
                StatusDescription = s.Status.Description,
                QuestionnaireAnswerSubmittedTimeUtc = s.QuestionnaireAnswer.OrderByDescending(o => o.QuestionnaireAnswerSubmittedTimeUtc).Select(s => s.QuestionnaireAnswerSubmittedTimeUtc).FirstOrDefault()
            }).ToListAsync();

            //TODO: only paged data needs to pick from the database
            var pagedList = new PagedList<ProspectListViewModel>(items, totalItemsCount,
                searchViewModel.PageNumber,
                searchViewModel.PageSize);

            return pagedList;
        }
        public async Task<bool> IsAccessAllowedToSalesStaff(int prospectId, long salesStaffId)
        {
            if (prospectId > 0 && salesStaffId > 0)
            {
                var query = FormBaseQuery(p => p.Id.Equals(prospectId) && p.SalesStaffId != null && p.SalesStaffId == salesStaffId, includeRelatedObjects: null);
                return await query.AnyAsync();
            }
            return false;
        }
        public async Task<Prospect?> FindAsync(object id, params string[]? includeRelatedObjects)
        {
            if (includeRelatedObjects?.Length == 0)
            {
                return await base.FindAsync(id);
            }
            var query = FormBaseQuery(p => p.Id.Equals(id), includeRelatedObjects: includeRelatedObjects);
            return await query.SingleOrDefaultAsync();
        }
        public async Task<bool> DeleteAsync(long id, bool saveChanges = true)
        {
            var prospect = await FindAsync(id);
            if (prospect == null)
            {
                return false;
            }
            prospect.Deleted = true;
            prospect.DeletedTimeUtc = DateTime.UtcNow;

            await UpdateAsync(prospect, saveChanges);

            return true;
        }
    }
}
