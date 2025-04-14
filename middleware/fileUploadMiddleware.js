// public/uploads.js

import fs from 'fs';
import multer from 'multer';
import cloudFunctions from '../config/cloud.js';
const { cloud } = cloudFunctions;
// import sharp from 'sharp';

const path = 'public/uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.exists(path, (exists) => {
      if (exists) cb(null, path);
      else {
        fs.mkdirSync(path, { recursive: true });
        cb(null, path);
      }
    });
  },

  filename: (req, file, cb) => {
    let filename = file.originalname.substr(0, file.originalname.lastIndexOf('.'));
    filename = filename.replace(/[,.\s]/g, '');
    let fileType = file.originalname.substr(file.originalname.lastIndexOf('.') + 1) || file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1);
    cb(null, `${filename.toLowerCase()}-${Date.now()}`);
  },
});

const allow_filesType = {
  image: ['image/png', 'image/jpeg', 'image/jpg'],
  video: ['video/mp4', 'video/mkv', 'video/x-msvideo', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
  raw: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

const checkFileType = (file, types) => {
  return types.includes(file.mimetype);
};

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [...allow_filesType.image, ...allow_filesType.video, ...allow_filesType.audio, ...allow_filesType.raw];
    if (!allowedTypes.some(type => checkFileType(file, type))) {
      return cb({ message: 'Invalid file type. Please check allowed files in API docs.' });
    }
    cb(null, true);
  },
});

export const fileUpload = (type, value, limit = 10) => {
  return (req, res, next) => {
    let validateFile;
    if (type === 'single') {
      validateFile = upload.single(value);
    }
    if (type === 'array') {
      validateFile = upload.array(value, limit);
    }
    if (type == "fields") {
      validateFile = upload.fields(value);
    }
    validateFile(req, res, err => {
      if (err) {
        return res.status(400).json({
          status_code: 400,
          message: err.message,
          success: false,
        });
      }
      next();
    });
  };
};

const removeFileFromTmpFolder = async (filepath) => {
  return await fs.promises.unlink(filepath);
};

// const resizeImage = async (inputPath, outputPath, extension = 'jpeg', width = 800, height = 800, quality = 90) => {
//   try {
//     await sharp(inputPath)
//       .resize(width, height, {
//         fit: sharp.fit.inside,
//         withoutEnlargement: true,
//       })
//       .toFormat(extension, { quality })
//       .toFile(outputPath);
//     return outputPath;
//   } catch (error) {
//     console.error('Error resizing image:', error);
//   }
// };

export const prepareAndUpload = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next(); // Proceed if no files are present
  }

  try {
    const files = req.files ? req.files : [req.file];
    const uploadedMedia = [];

    const processFile = async (file) => {
      const filePath = file.path;
      const fileSizeLimit = 11000000; // 10 MB limit
      const extension = file.mimetype.split('/').pop();
      let resourceType = file.mimetype.split('/')[0];

      // Adjust resource type for non-standard cases
      if (resourceType === 'application') {
        resourceType = 'raw';
      }

      if (file.size > fileSizeLimit) {
        throw new Error('File size should be less than 10MB');
      }

      // Upload to cloud
      await cloud.uploader.upload(filePath, {
        public_id: file.filename,
        resource_type: resourceType,
      });

      // Remove the file from the temporary folder
      await removeFileFromTmpFolder(filePath);

      return file.filename;
    };

    // Handle both flat and nested file structures
    if (Array.isArray(files)) {
      for (const file of files) {
        uploadedMedia.push(await processFile(file));
      }
    } else {
      for (const key in files) {
        const fileList = Array.isArray(files[key]) ? files[key] : [files[key]];
        for (const file of fileList) {
          uploadedMedia.push(await processFile(file));
        }
      }
    }

    // Attach uploaded file names to the request object
    req.uploadedFiles = uploadedMedia;

    next(); // Proceed to the next middleware
  } catch (error) {
    console.error('Error in prepareAndUpload:', error);

    const statusCode = error.http_code || 400;
    const message = error.message || 'Error uploading file';

    return res.status(statusCode).json({
      status_code: statusCode,
      message,
      success: false,
    });
  }
};


export const baseUrlGenerator = (type, object) => {
  let tempArray = [];
  if (type === 'single') {
    const resource_type = object.mimetype.substr(0, object.mimetype.indexOf('/'));
    const fileType = object.originalname.substr(object.originalname.lastIndexOf('.') + 1) || object.mimetype.substr(object.mimetype.lastIndexOf('/') + 1);
    if (resource_type === 'application')
      resource_type = 'raw';
    return {
      url: cloud.url(object.filename, {
        resource_type,
        quality: 'auto',
      }) + `.${fileType}`,
      size: object.size,
      filename: object.filename,
      fileType: object.mimetype,
    };
  } else if (type === 'multiple') {
    for (let i in object) {
      let resource_type = object[i].mimetype.substr(0, object[i].mimetype.indexOf('/'));
      let fileType = object[i].originalname.substr(object[i].originalname.lastIndexOf('.') + 1) || object[i].mimetype.substr(object[i].mimetype.lastIndexOf('/') + 1);
      if (resource_type === 'application')
        resource_type = 'raw';
      tempArray.push({
        url: cloud.url(object[i].filename, {
          resource_type,
          quality: 'auto',
        }) + `.${fileType}`,
        size: object[i].size,
        filename: object[i].filename,
        fileType: object[i].mimetype,
      });
    }
    return tempArray;
  } else {
    return {};
  }
  // if (req.file) {
  //   let file = req.file;
  //   let resource_type = file.mimetype.substr(0, file.mimetype.indexOf('/'));
  //   let fileType = file.originalname.substr(file.originalname.lastIndexOf('.') + 1) || file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1);
  //   if (resource_type === 'application')
  //     resource_type = 'raw';
  //   return {
  //     url: cloud.url(req.file.filename, {
  //       resource_type,
  //       quality: 'auto'
  //     }) + `.${fileType}`,
  //     size: req.file.size,
  //     filename: req.file.filename,
  //     type: req.file.mimetype
  //   };
  // }
  // if (req.files) {
  //   let media = [];
  //   let files = req.files;
  //   console.log("files", files);
  //   files.map(file => {
  //     let resource_type = file.mimetype.substr(0, file.mimetype.indexOf('/'));
  //     let fileType = file.originalname.substr(file.originalname.lastIndexOf('.') + 1) || file.mimetype.substr(file.mimetype.lastIndexOf('/') + 1);
  //     if (resource_type === 'application')
  //       resource_type = 'raw';
  //     media.push({
  //       url: cloud.url(file.filename, {
  //         resource_type,
  //         quality: 'auto'
  //       }) + `.${fileType}`,
  //       size: file.size,
  //       filename: file.filename,
  //       type: file.mimetype
  //     });
  //   });
  //   return media;
  // }
  // return '';
};
