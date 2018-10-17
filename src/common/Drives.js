import { FileDrive } from '../drives/FileDrive';

import GoogleDrive from '../drives/GoogleDrive';

const drives = {
    handlers: {
        files: new FileDrive(),
        googleDrive: new GoogleDrive()
    }
}


export default drives;