const {cert} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const admin = require('firebase-admin');

const serviceAccount = {
  type: "service_account",
  project_id: "dreamelevenclone",
  private_key_id: process.env.private_key_id,
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDRiGl2H/tn9MYC\nzAUlUUGLm2Z/DhbRMoBSdKglDysu2Wi6ZyV1UcVEnLGgXOwByfIW8G+d1lamRTZ7\nX2AbhxBd7iWPAt00TQl4L5EVoX7b7Lm24T7fKyQTBbll/vMQAhOia6YjFpaXJ2WS\nCMzeuv0hwfwpGic2Srvm5gldMycc976VlQF1ArLb2hBshNUGQE3XTQbffJNNLBFS\nz9z3TjKGxrUkCZnnlzVkBWewVPjB7f7GyH8NOqgPipuXEl3GqfXblrtT7bCoeb5t\nyEC3hybcZIU2DVPGJtsbz09g6eSnMsN3KGN/Sh8Ikayqg67hnJ75lUCJP0UXFUPq\nvIqq8KiJAgMBAAECggEALHE3ETd6XxPTVe+JHd+su9xDsqo927RO9G5K5cVgXuj9\nJiBPmSE1arajlERxSHXZc9Uej4dRTKX8htF1dJFCvvGOpNUyLvAyFHxeVQyyeBov\nT+NZrwMa/S/nIYOgcWJHYNldXS7i1P+lswJL1egqXZkkD2G9NG5IiZJ8JPj/EEz3\nUVPoGID9nFdCDGZpbhgwX85/Zcf6K97ooumaz2hhmQFBKgInOoOBh9xgsE1Jj8Xw\nExCQ1p5EkxZQe3I1mdWr2Fky59iSNo0uIXBXsojYQUuNe9SMqwoCvQMoIRLzX6ut\nWJbn4gLpmFSKoybb8NIjDtdTCz+sbuwdl2K2210suwKBgQD8hMsi0KKc32EfbdO7\nt+4dWbr2JCPyKXvbslVRjfXi95VQiIZbJCJm5FnBAF/C8fJBgEsV6q5Jv6PkY2CH\nxQitxpB9motvv3nMIQxuiUweiZNPYSOLuypll74aeYTfzihGvZpXMGadvy4isRUa\nz02ehbIrRh1L5z9Pdtmm4ALa7wKBgQDUa+jnMGUqsIiy5oCXt6cSdlqGvYMw666U\nWMTqek/1cJZXKu9yk1atHv6GYZ0zJBLWKlQMfKGUrjut6khV6KullTZb6HwU7dYL\nnHWrby9oA3tm9cuiKuO/gRE2mA3tgwHB5uH5GeYQHxL8Pu1UN8Q8IdDMJ/uNkVK6\nJUwI8l4UBwKBgQDaXXdQjvzgDWduh0ne/gpChVLhAZW4FtmNvaR8Fvf4IsOTVcxh\nyliZg4R+GvW0ngcxT2Ee/cdj7P4sRSe3oNKFe719cIR9ySXpOPcIK2CQ08V4knbr\noZnjKppxSH54D03TBqkOFsPWS/n4dAvdGEF2AQV22HYDKmEcNZm37eVqLwKBgQDK\n7LdWu+25RWGhff/Ub/Zj9bpvQ3Wjc1KYluCumt/tuXt1lCegzc4cniJKH9A7vbdc\n7pzSPPFjBrsuXkRyBU6MZSnDzSlUGQzElNf4SMQB2mm1pxO8PLrLBDJ8c+/COMei\nA71V6X7VYcoSPM8eCBQn2aoMjhmKWQytlNm5JkfnWwKBgQDQanav4FXJKIo/ccEH\nx2QyFn0oxMZfrIPkI14ZxfYQ+clswmAjpaHlVn9pGaR1SHGRMFDqpVZj257GyP8K\nwQzImjawr6dki63AwJAFvfuieKo6BY/iTVmGdol7q2UV7eHQLMm64f9QzR3uREW3\nHctnRWqWMnocga/NWBCG/2QiPA==\n-----END PRIVATE KEY-----\n",
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-46oin%40dreamelevenclone.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};
admin.initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'dreamelevenclone.appspot.com'
});
const bucket = admin.storage().bucket();
// Get the downloadUrl for a given file ref
async function uploadImage(id) {
  try {
    // Local path to the image file you want to 
    if (id) {
      const localFilePath = `images/backgroundremoved/${id}.png`;
      // Destination path in Firebase Storage
      const destinationPath = `images/${id}.png`;

      // Upload the image file
     const a= await bucket.upload(localFilePath, {
        destination: destinationPath,
        // You can specify metadata for the file if needed
        metadata: {
          contentType: 'image/jpeg', // Adjust according to your file type
          // You can add more metadata fields as needed
        },
      });

      console.log(a,'Image uploaded successfully.');
      return a
    }
  } catch (error) {
    console.error('Error uploading image:', error);
  }
}

// Call the function to upload the image
// uploadImage();
module.exports.uploadImage = uploadImage;
module.exports.db = getFirestore();
