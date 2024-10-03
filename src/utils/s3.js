const AWS = require('aws-sdk');
const fs = require('fs');
import dotenv from 'dotenv';



dotenv.config();

// Set the region and access keys for AWS S3
AWS.config.update({
  accessKeyId: process.env.aws_access_key,
  secretAccessKey: process.env.aws_secret_key,
  region: process.env.aws_region
});

// Create a new instance of the S3 object
const s3 = new AWS.S3({ region: 'us-east-1' });

// Upload a file to AWS S3
async function uploadFileToS3(bucketName, keyName, buffer, pdf) {

  try {
    const params = {
      Bucket: bucketName,
      Key: keyName,
      Body: buffer
    };
    if (pdf) {
      params['ContentType'] = 'application/pdf';
    }
    const uploadResult = await s3.upload(params).promise();
  
    return uploadResult.Location;
  } catch (error) {
    console.log({error});
  }
}

async function createAWSBucket(bucketName) {
  console.log(process.env.aws_region,bucketName);
  const createBucketParams = {
    Bucket: bucketName,
    // CreateBucketConfiguration: {
    //   LocationConstraint: process.env.aws_region, // Set the region where the bucket will be created
    // },
  };
  try {
    s3.createBucket(createBucketParams, function (err, data) {
      if (err) {
        console.log(err);
        if (err.code === 'BucketAlreadyOwnedByYou') {
          return { status: 'fail', message: 'you already own this bucket' };
        }
        return { status: 'fail', message: 'failed to create bucket' };
      } else {
        console.log(data);
        // Now set CORS configuration for the created bucket
        const putCorsParams = {
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: [
              {
                'AllowedHeaders': [
                  '*'
                ],
                'AllowedMethods': [
                  'GET',
                  'HEAD'
                ],
                'AllowedOrigins': [
                  '*'
                ],
                'ExposeHeaders': []
              }
            ],
          },
        };
    
        s3.putBucketCors(putCorsParams, function (err, data) {
          if (err) {
            console.error(err);
          } else {
            console.log('CORS Configuration updated successfully');
          }
        });
        return { status: 'success', message: 'bucket create', location: data?.Location };
      }
    });
    
  } catch (error) {
    console.log(error);
  }

}

// Function to check if a bucket exists
async function doesBucketExist(bucketName) {
  try {
    // Call headBucket to check if the bucket exists
    await s3.headBucket({ Bucket: bucketName }).promise();
    return true; // Bucket exists
  } catch (error) {
    if (error.code === 'NotFound') {
      return false; // Bucket does not exist
    } else {
      throw error; // Other errors
    }
  }
}

function bytesToGB(bytes) {
  if (bytes < 0) {
    throw new Error('Input must be a non-negative number.');
  }
  return bytes / Math.pow(1024, 3);
}

async function checkBucketStorageAvailability({ bucketName, selectedPDFSizeBytes, totalStorage }) {
  if (!bucketName) {
    return;
  }
  try {
    const params = {
      Bucket: bucketName,
    };

    const response = await s3.listObjectsV2(params).promise();
    const totalBytes = response.Contents.reduce((acc, obj) => { acc = acc + obj.Size; return acc; }, 0);
    const totalBytesWithPDF = totalBytes + selectedPDFSizeBytes;
    const totalGBFromBytes = bytesToGB(totalBytesWithPDF);
    if (totalGBFromBytes > totalStorage) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error getting bucket size:', error.message);
    return -1; // or any other value to indicate an error
  }
}

async function getBucketSize(bucketName, totalGB) {

  if (!bucketName) {
    return;
  }
  try {
    const params = {
      Bucket: bucketName,
    };
    const response = await s3.listObjectsV2(params).promise();
    // Calculate the total size of all objects in the bucket
    const totalBytes = response.Contents.reduce((acc, obj) => { acc = acc + obj.Size; return acc; }, 0);
    const totalGBFromBytes = bytesToGB(totalBytes);

    // Calculate the percentage
    const percentage = totalGB ? (totalGBFromBytes / totalGB) * 100 : 0;
    return {
      percentage: totalGB && `${percentage.toFixed(2)}%`,
      totalGBFromBytes: totalGBFromBytes,
    };
  } catch (error) {
    console.error('Error getting bucket size:', error.message);
    return -1; // or any other value to indicate an error
  }
}

async function deleteBucketAndContents(bucketName) {
  try {
    // List objects in the bucket
    const listData = await s3.listObjectsV2({ Bucket: bucketName }).promise();

    // Delete each object in the bucket
    const deleteParams = {
      Bucket: bucketName,
      Delete: { Objects: [] },
    };

    listData.Contents.forEach((object) => {
      deleteParams.Delete.Objects.push({ Key: object.Key });
    });

    // Delete objects in the bucket
    if (deleteParams.Delete.Objects.length > 0) {
      await s3.deleteObjects(deleteParams).promise();
      console.log('Successfully deleted objects in the bucket.');
    }

    // Delete the bucket
    await s3.deleteBucket({ Bucket: bucketName }).promise();
    console.log('Successfully deleted bucket:', bucketName);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function deleteContent({bucketName, keyName}) {
  const params = {
    Bucket: bucketName,
    Delete: { Objects: [{Key: keyName}] },
  };
  if (params.Delete.Objects.length > 0) {
    await s3.deleteObjects(params).promise();
    console.log('Successfully deleted objects in the bucket.');
  }
}

// Download a file from AWS S3
async function downloadFileFromS3(bucketName, keyName, destinationPath) {
  const params = {
    Bucket: bucketName,
    Key: keyName
  };

  const fileStream = fs.createWriteStream(destinationPath);

  const downloadResult = await s3.getObject(params).createReadStream().pipe(fileStream);

  return downloadResult;
}


function generatePresignedUrl(bucketName, keyName) {
  const params = {
    Bucket: bucketName,
    Key: keyName,
    Expires: 3600,
  };
  return s3.getSignedUrl('getObject', params);
}

async function getS3Data(bucketName, keyName) {
  // Set the S3 parameters
  const params = {
    Bucket: bucketName,
    Key: keyName,
  };

  // Get the S3 image data
  const s3ImageData = await s3.getObject(params).promise();
  return s3ImageData;
}

async function extractBucketAndKey(s3Url) {
  const urlParts = s3Url.split('/');
  const bucketName = urlParts[2].split('.')[0];
  const keyName = urlParts.slice(3).join('/');

  return { bucketName, keyName };
}

async function uploadBase64toS3(bucketName, keyName, base64Data) {
  const buf = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const data = {
    Bucket: bucketName,
    Key: keyName,
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg'
  };
  const uploadResult = await s3.upload(data).promise();

  return uploadResult.Location;
}

// Function to validate a bucket name
function isValidBucketName(bucketName) {
  // Check if the bucket name meets the requirements
  const isValid = /^[a-z0-9.-]+$/.test(bucketName);

  return isValid;
}

module.exports = {
  uploadFileToS3,
  downloadFileFromS3,
  generatePresignedUrl,
  getS3Data,
  extractBucketAndKey,
  createAWSBucket,
  deleteBucketAndContents,
  getBucketSize,
  uploadBase64toS3,
  doesBucketExist,
  isValidBucketName,
  checkBucketStorageAvailability,
  deleteContent
};
