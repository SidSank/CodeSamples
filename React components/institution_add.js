import InputForm from '~/apps/admin/components/forms/input';
import styled from 'styled-components';
import useModalInfoContext from '~/apps/admin/utils/hooks/useModalInfoContext';
import {
  AUDIO_SMALL_CASE,
  COUNT,
  DEFAULT_MAX,
  DEFAULT_VALUE,
  IMAGE_SMALL_CASE,
  MINUTES,
  THRESHOLD_SETTINGS_OVERRIDE,
  VIDEO_SMALL_CASE,
  WEBHOOK_URLS,
} from '~/lib/constant';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { InnerSpinner } from '~/utils/styled';
import { Link, withRouter } from 'react-router-dom';
import { getThreshold } from '~/apps/admin/utils/helpers';
import { notEmpty } from '~/apps/admin/utils/form/validations';
import { useEffect, useState } from 'react';

const StyledCol = styled(Col)`
  text-align: left;
`;

const StyledRow = styled(Row)`
  margin-top: 20px;
`;

const CreateUserButton = styled(Button)`
  font-family: 'Akkurat Std', sans-serif;
  font-size: 14px;
  float: right;
  background: #2e2e2e;
  border: 1px solid #2e2e2e;
  text-decoration: none;
  border-radius: 30px;
  padding: 15px 30px;
  :hover,
  :not(:disabled):not(.disabled):active {
    background: #000000;
    border: 1px solid #000000;
  }
`;

const CancelLink = styled(Link)`
  font-family: 'Akkurat Std', sans-serif;
  margin-top: 15px;
  margin-right: 40px;
  float: right;
`;
const StyledThresholdModelP = styled.p`
  font-family: 'Akkurat Std', sans-serif;
  margin-left: 15px;
`;
const StyledThresholdMediaTypeP = styled.p`
  font-family: 'Akkurat Std', sans-serif;
  margin-left: 15px;
  font-weight: bold;
`;
const StyledColModelSetting = styled.div`
  margin-left: 30px;
`;
const StyledInputForm = styled(InputForm)`
  &.input {
    display: inline !important;
  }
`;

function ModelSettingInput({ model, disabled, value, onChange }) {
  return (
    <StyledInputForm
      label={`${model} - FAKE:`}
      modalName={model}
      inputType="number"
      disabled={disabled}
      inputValue={value}
      min={0}
      max={100}
      handleChange={e => onChange(e)}
    />
  );
}

const InstitutionAdd = ({ requestInstitutionCreate, history }) => {
  const modalInfo = useModalInfoContext();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [videoOverallMethod, setVideoOverallMethod] = useState(DEFAULT_MAX);
  const [imageOverallMethod, setImageOverallMethod] = useState(DEFAULT_MAX);
  const [videoSettingEnable, setVideoSettingEnable] = useState(false);
  const [imageSettingEnable, setImageSettingEnable] = useState(false);
  const [audioSettingEnable, setAudioSettingEnable] = useState(false);
  const [webhookUrls, setWebhookUrls] = useState([]);
  const [videoUploadLimit, setVideoUploadLimit] = useState(-1);
  const [audioUploadLimit, setAudioUploadLimit] = useState(-1);
  const [imageUploadLimit, setImageUploadLimit] = useState(-1);
  const [videoTypeLimit, setVideoTypeLimit] = useState(COUNT);
  const [audioTypeLimit, setAudioTypeLimit] = useState(COUNT);
  const [videoThreshold, setVideoThreshold] = useState([]);
  const [audioModelThreshold, setAudioModelThreshold] = useState([]);
  const [imageThreshold, setImageThreshold] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (modalInfo || modalInfo.length) {
      setLoading(false);
    }
  }, [modalInfo]);

  const handleFieldChange = (e, type) => {
    const slug = e.target.name;
    const threshold = e.target.value;

    if (type.toLocaleLowerCase() === IMAGE_SMALL_CASE.toLocaleLowerCase()) {
      let thresholdData = [...imageThreshold];
      const pageIndex = thresholdData.findIndex(x => x.slug === slug);
      if (threshold.trim() !== '') {
        if (parseInt(threshold) >= 0 && parseInt(threshold) <= 100) {
          thresholdData[pageIndex].threshold = threshold;
        }
      } else {
        thresholdData[pageIndex].threshold = '';
      }
      setImageThreshold(thresholdData);
    }

    if (type.toLocaleLowerCase() === VIDEO_SMALL_CASE.toLocaleLowerCase()) {
      let thresholdData = [...videoThreshold];
      const pageIndex = thresholdData.findIndex(x => x.slug === slug);
      if (threshold.trim() !== '') {
        if (parseInt(threshold) >= 0 && parseInt(threshold) <= 100) {
          thresholdData[pageIndex].threshold = threshold;
        }
      } else {
        thresholdData[pageIndex].threshold = '';
      }
      setVideoThreshold(thresholdData);
    }

    if (type.toLocaleLowerCase() === AUDIO_SMALL_CASE.toLocaleLowerCase()) {
      let thresholdData = [...audioModelThreshold];
      const pageIndex = thresholdData.findIndex(x => x.slug === slug);
      if (threshold.trim() !== '') {
        if (parseInt(threshold) >= 0 && parseInt(threshold) <= 100) {
          thresholdData[pageIndex].threshold = threshold;
        }
      } else {
        thresholdData[pageIndex].threshold = '';
      }
      setAudioModelThreshold(thresholdData);
    }
  };

  useEffect(() => {
    let videoSlug = [];
    let imgSlug = [];
    let audioSlug = [];

    modalInfo.filter(item => {
      if (item.handledMediaType[0].toLocaleLowerCase() === VIDEO_SMALL_CASE.toLocaleLowerCase()) {
        videoSlug.push({ slug: item.slug, threshold: '' });
      }

      if (item.handledMediaType[0].toLocaleLowerCase() === IMAGE_SMALL_CASE.toLocaleLowerCase()) {
        imgSlug.push({ slug: item.slug, threshold: '' });
      }

      if (item.handledMediaType[0].toLocaleLowerCase() === AUDIO_SMALL_CASE.toLocaleLowerCase()) {
        audioSlug.push({ slug: item.slug, threshold: '' });
      }
    });
    setVideoThreshold(videoSlug);
    setImageThreshold(imgSlug);
    setAudioModelThreshold(audioSlug);
  }, [modalInfo]);

  const createInstitution = () => {
    const errorAux = {
      name: null,
      address: null,
    };
    errorAux.name = notEmpty(name);
    errorAux.address = notEmpty(address);
    setErrors(errorAux);

    const formValid = Object.values(errorAux).every(x => x === null || x === '');

    let videoUploadTimeLimit = -1;
    let videoUploadLengthLimit = -1;
    let audioUploadTimeLimit = -1;
    let audioUploadLengthLimit = -1;
    if (videoTypeLimit === MINUTES) {
      videoUploadLengthLimit = videoUploadLimit;
    } else {
      videoUploadTimeLimit = videoUploadLimit;
    }
    if (audioTypeLimit === MINUTES) {
      audioUploadLengthLimit = audioUploadLimit;
    } else {
      audioUploadTimeLimit = audioUploadLimit;
    }
    let modelSettings = {};
    let overallMethod = {};

    const threshold = getThreshold(
      videoThreshold,
      videoOverallMethod,
      imageOverallMethod,
      imageThreshold,
      audioModelThreshold,
      imageSettingEnable,
      videoSettingEnable
    );

    modelSettings = threshold.modelSettings;
    overallMethod = threshold.overallMethod;

    let modelSettingsOverride;
    if (Object.keys(modelSettings).length) {
      modelSettingsOverride = {
        modelSettings: {
          ...modelSettings,
        },
      };
    }
    if (Object.keys(overallMethod).length) {
      modelSettingsOverride = {
        ...modelSettingsOverride,
        overallMethod: {
          ...overallMethod,
        },
      };
    }

    if (formValid) {
      const institution = {
        name,
        address,
        modelSettings: modelSettingsOverride || '',
        webhookUrls,
        videoUploadTimeLimit,
        videoUploadLengthLimit,
        audioUploadTimeLimit,
        audioUploadLengthLimit,
        imageUploadLimit,
        videoTypeLimit:
          videoTypeLimit === MINUTES ? 'videoUploadLengthLimit' : 'videoUploadTimeLimit',
        audioTypeLimit:
          audioTypeLimit === MINUTES ? 'audioUploadLengthLimit' : 'audioUploadTimeLimit',
      };
      new Promise((resolve, reject) => {
        requestInstitutionCreate({ institution, resolve, reject });
      }).then(() => {
        setErrors({});
        history.push('/institution');
      });
    }
  };

  const mediaOverallSetting = (image, video) => {
    if (imageSettingEnable) {
      let imgThreshold = [...imageThreshold];
      if (image === 'AND' || image === 'OR') {
        imgThreshold = imgThreshold.map(item => ({ ...item, threshold: DEFAULT_VALUE }));
        setImageThreshold(imgThreshold);
      } else if (image === DEFAULT_MAX) {
        imgThreshold = imgThreshold.map(item => ({ ...item, threshold: undefined }));
        setImageThreshold(imgThreshold);
      }
    }
    if (videoSettingEnable) {
      let vidThreshold = [...videoThreshold];
      if (video === 'AND' || video === 'OR') {
        vidThreshold = vidThreshold.map(item => ({ ...item, threshold: DEFAULT_VALUE }));
        setVideoThreshold(vidThreshold);
      } else if (video === DEFAULT_MAX) {
        vidThreshold = vidThreshold.map(item => ({ ...item, threshold: undefined }));
        setVideoThreshold(vidThreshold);
      }
    }
  };

  const overAllMediaCheck = mediaSettingEnable => {
    if (mediaSettingEnable === 'videoSettingEnable') {
      setVideoSettingEnable(!videoSettingEnable);
      if (videoSettingEnable) {
        let vidThreshold = [...videoThreshold];
        setVideoOverallMethod(DEFAULT_MAX);
        vidThreshold = vidThreshold.map(item => ({ ...item, threshold: undefined }));
        setVideoThreshold(vidThreshold);
      }
    }
    if (mediaSettingEnable === 'imageSettingEnable') {
      setImageSettingEnable(!imageSettingEnable);
      if (imageSettingEnable) {
        let imgThreshold = [...imageThreshold];
        setImageOverallMethod(DEFAULT_MAX);
        imgThreshold = imgThreshold.map(item => ({ ...item, threshold: undefined }));
        setImageThreshold(imgThreshold);
      }
    }
    if (mediaSettingEnable === 'audioSettingEnable') {
      setAudioSettingEnable(!audioSettingEnable);
      if (audioSettingEnable) {
        let audioThreshold = [...audioModelThreshold];
        audioThreshold = audioThreshold.map(item => ({ ...item, threshold: undefined }));
        setAudioModelThreshold(audioThreshold);
      }
    }
  };

  useEffect(() => {
    mediaOverallSetting(imageOverallMethod, videoOverallMethod);
  }, [imageOverallMethod, videoOverallMethod]);

  return loading ? (
    <InnerSpinner />
  ) : (
    <Container>
      <Row>
        <StyledCol>
          <h2 className="title">Add a Institution</h2>
        </StyledCol>
      </Row>
      <Row>
        <Col>
          <Form>
            <Row>
              <Col lg={4}>
                <InputForm
                  label="Institution Name"
                  inputType="input"
                  inputValue={name}
                  handleChange={event => setName(event.target.value)}
                  error={errors.name}
                />
              </Col>
              <Col lg={4}>
                <InputForm
                  label="Address"
                  inputType="input"
                  inputValue={address}
                  handleChange={event => setAddress(event.target.value)}
                  error={errors.address}
                />
              </Col>
            </Row>
            <StyledRow>
              <StyledCol lg={4}>
                <InputForm
                  label="Images Upload Limit"
                  inputType="number"
                  inputValue={imageUploadLimit}
                  handleChange={event => {
                    setImageUploadLimit(parseInt(event.target.value));
                  }}
                  error={errors.imageUploadLimit}
                />
              </StyledCol>
            </StyledRow>
            <StyledRow>
              <StyledCol lg={4}>
                <select
                  VALUE={videoTypeLimit}
                  onChange={event => {
                    setVideoTypeLimit(event.target.value);
                  }}
                  className="form-select"
                  style={{
                    position: 'absolute',
                    right: '7.5rem',
                    top: '1.5rem',
                  }}
                >
                  <option value={COUNT}>{COUNT}</option>
                  <option value={MINUTES}>{MINUTES}</option>
                </select>
                <InputForm
                  label="Video Upload Limit"
                  inputType="number"
                  inputValue={videoUploadLimit}
                  handleChange={event => {
                    setVideoUploadLimit(event.target.value);
                  }}
                  error={errors.videoUploadLimit}
                />
              </StyledCol>
              <StyledCol lg={4}>
                <select
                  VALUE={audioTypeLimit}
                  onChange={event => {
                    setAudioTypeLimit(event.target.value);
                  }}
                  className="form-select"
                  style={{
                    position: 'absolute',
                    right: '7.5rem',
                    top: '1.5rem',
                  }}
                >
                  <option value={COUNT}>{COUNT}</option>
                  <option value={MINUTES}>{MINUTES}</option>
                </select>
                <InputForm
                  label="Audio Upload Limit"
                  inputType="number"
                  inputValue={audioUploadLimit}
                  handleChange={event => {
                    setAudioUploadLimit(event.target.value);
                  }}
                  error={errors.audioUploadLimit}
                />
              </StyledCol>
            </StyledRow>
            <StyledRow>
              <StyledCol lg={6} className="webhookUrls-input">
                <Form.Group>
                  <InputForm
                    label={WEBHOOK_URLS}
                    inputType="input"
                    inputValue={webhookUrls}
                    handleChange={event => setWebhookUrls(event.target.value)}
                  />
                </Form.Group>
              </StyledCol>
            </StyledRow>
            <StyledRow>
              <StyledCol>
                <label htmlFor="enableAudioExtraction">
                  <b>{THRESHOLD_SETTINGS_OVERRIDE}</b>
                </label>
                <p>
                  {` (Value of model is the threshold, if score < threshold then AUTHENTIC else FAKE)`}
                </p>
              </StyledCol>
            </StyledRow>
            <StyledRow>
              <StyledCol lg={6}>
                <StyledThresholdMediaTypeP>
                  <input
                    type="checkbox"
                    defaultChecked={imageSettingEnable}
                    onChange={() => overAllMediaCheck('imageSettingEnable')}
                  />{' '}
                  Image
                </StyledThresholdMediaTypeP>
                <StyledColModelSetting>
                  <StyledThresholdModelP>
                    <Form.Group>
                      <Form.Label style={{ marginBottom: 20 }}> Overall Method Setting:</Form.Label>
                      <br />
                      <select
                        disabled={!imageSettingEnable}
                        onChange={event => {
                          setImageOverallMethod(event.target.value);
                        }}
                        className="form-select"
                      >
                        <option
                          disabled={audioSettingEnable ? true : null}
                          value={DEFAULT_MAX}
                          selected={imageOverallMethod === DEFAULT_MAX ? 'selected' : ''}
                        >
                          {DEFAULT_MAX}
                        </option>
                        <option
                          value="AND"
                          selected={imageOverallMethod === 'AND' ? 'selected' : ''}
                        >
                          AND
                        </option>
                        <option value="OR" selected={imageOverallMethod === 'OR' ? 'selected' : ''}>
                          OR
                        </option>
                      </select>
                    </Form.Group>
                  </StyledThresholdModelP>
                </StyledColModelSetting>
                {imageThreshold?.map(item => {
                  return (
                    <>
                      <StyledColModelSetting key={item}>
                        <StyledCol lg={6}>
                          <ModelSettingInput
                            model={item?.slug}
                            modalName={item?.slug}
                            inputType="number"
                            disabled={!imageSettingEnable}
                            value={item?.threshold}
                            onChange={e => handleFieldChange(e, 'image')}
                          />
                        </StyledCol>
                      </StyledColModelSetting>
                    </>
                  );
                })}
              </StyledCol>
              <StyledCol lg={6}>
                <StyledThresholdMediaTypeP>
                  <input
                    type="checkbox"
                    defaultChecked={videoSettingEnable}
                    onChange={() => overAllMediaCheck('videoSettingEnable')}
                  />{' '}
                  Video
                </StyledThresholdMediaTypeP>
                <StyledColModelSetting>
                  <StyledThresholdModelP>
                    <Form.Group>
                      <Form.Label style={{ marginBottom: 20 }}> Overall Method Setting:</Form.Label>
                      <br />
                      <select
                        disabled={!videoSettingEnable}
                        onChange={event => {
                          setVideoOverallMethod(event.target.value);
                        }}
                        className="form-select"
                      >
                        <option
                          value="DEFAULT (MAX)"
                          selected={videoOverallMethod === DEFAULT_MAX ? 'selected' : ''}
                        >
                          DEFAULT (MAX)
                        </option>
                        <option
                          value="AND"
                          selected={videoOverallMethod === 'AND' ? 'selected' : ''}
                        >
                          AND
                        </option>
                        <option value="OR" selected={videoOverallMethod === 'OR' ? 'selected' : ''}>
                          OR
                        </option>
                      </select>
                    </Form.Group>
                  </StyledThresholdModelP>
                </StyledColModelSetting>
                {videoThreshold?.map((item, index) => {
                  return (
                    <>
                      <StyledColModelSetting>
                        <StyledCol lg={6} key={item?.slug}>
                          <ModelSettingInput
                            model={item?.slug}
                            modalName={item?.slug}
                            inputType="number"
                            disabled={!videoSettingEnable}
                            value={item?.threshold}
                            onChange={e => handleFieldChange(e, 'video')}
                          />
                        </StyledCol>
                      </StyledColModelSetting>
                    </>
                  );
                })}
              </StyledCol>
            </StyledRow>
            <StyledRow>
              <StyledCol lg={6}>
                <StyledThresholdMediaTypeP>
                  <input
                    type="checkbox"
                    defaultChecked={audioSettingEnable}
                    onChange={() => overAllMediaCheck('audioSettingEnable')}
                  />{' '}
                  Audio
                </StyledThresholdMediaTypeP>
                {audioModelThreshold?.map(item => {
                  return (
                    <>
                      <StyledColModelSetting>
                        <StyledCol lg={6}>
                          <ModelSettingInput
                            model={item?.slug}
                            modalName={item?.slug}
                            inputType="number"
                            disabled={!audioSettingEnable}
                            value={item?.threshold}
                            onChange={e => handleFieldChange(e, 'audio')}
                          />
                        </StyledCol>
                      </StyledColModelSetting>
                    </>
                  );
                })}
              </StyledCol>
            </StyledRow>
            <StyledRow>
              <Col lg={9}>
                <CreateUserButton onClick={createInstitution}>Create Institution</CreateUserButton>
                <CancelLink onClick={() => history.goBack()}>CANCEL</CancelLink>
              </Col>
            </StyledRow>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default withRouter(InstitutionAdd);
