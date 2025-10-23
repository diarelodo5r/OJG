export const environment = {
  apiBaseUrl: 'http://localhost:8000/api',
  webBaseUrl: 'http://localhost:8000',
  google: {
    apiKey: '',
    clientId: '',
    scopes: 'https://www.googleapis.com/auth/drive.file',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    driveApiUrl: 'https://www.googleapis.com/drive/v3/files',
    folders: {
      audio: '',
      documents: '',
      images: '',
      videos: ''
    }
  }
};
