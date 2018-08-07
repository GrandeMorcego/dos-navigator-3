import { FileDrive } from '../drives/FileDrive';

const drives = {
    handlers: {
        files: new FileDrive(),
    }
}


export default drives;