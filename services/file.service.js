const fs = require('fs');

const transferImage = (file, id, logger) => {
    try{
        logger('Uploaded file is an image');
        const newFileName = id + '.' + file.originalname.match(/\.(\w+)$/)[1];
        const newPath = `${file.destination}${newFileName}`;
        // Rename the file
        fs.renameSync(file.path, newPath);

        // Replace with the actual destination file path
        const destinationPath = 'public/images/' + newFileName; 

        fs.renameSync(newPath, destinationPath);
        return {
            status : true,
            path : destinationPath
        }
    } catch (err){
        logger('Error transferring the file:', err);
        return {
            status : false
        }
    }
}

const deleteImage = (filePath, logger) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                logger('File does not exist');
                return true;
            } else {
                logger('Error deleting the file:', err);
                return false;
            }
        } else {
            logger('File deleted successfully');
            return true;
        }
    });
}

module.exports = {
    transferImage,
    deleteImage
}