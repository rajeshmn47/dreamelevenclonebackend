const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");
const MatchLiveDetails = require("./models/match_live_details_scores_copy");
const Matches = require("./models/matchtwo");
const getkeys = require("../crickeys");

const serviceAccount = {
  type: "service_account",
  project_id: "dreamelevenclone",
  private_key_id: "38346114064715b48367437c5750a65fc139a66e",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDYbXsZKZds5KXY\nf4TyPiA3gjqewLrpMYffO7PPbJzlwauJTfFP/u99nkt+YLLEBRCY4kiJy3IrRmbD\nXd9Bw2dPfldB2QaocoCfsB2wyikIFj3/HeWmc0Rfa3FdfHIhUs8D0YoslTDIEEqL\n6RiDn7JS/rcz+2VQ9u4h07TkL+KHjQVjDpNj5Z/+s3xd/lG8Eiw//yBeVr+jseZb\nHdvS356RNf3+R1UEZTZvnUXyIDxnyuYq7gWUAsITvF8ukBc+aP1Ctl7ISoCSLe/I\nfUOBdMq1vjmBJdRvYJgqd0Yd1aRLQP5UvfeK9Zl2A8hEpxjaKBknG15ANGpAH+1U\npg50OAMvAgMBAAECggEADXqIA5GpChGVWI3ciD+hPwO/xdpH6bT5esgbkyv2+4Ib\nvkHZ6Pr+DEs69WRtTbLpDTRugxJmClbomHs0p8JVIUjDg2jSNtRmuUs9FiEI/CVy\nd/xzLHIaTH0DAuj4rKWdGeZHXi5uas9E7UC3k57y+qM9YqHh9fBi9T1bkyh+SaW7\n391L+uQeJn6sgj53gvfagl/6Gctm9OBgLsGmYs8nLllS0JOeB1sZ/t9etL7DkUx6\nzpxGF+yyBy0iSmNQ27kdmEB4pyhCPjEEqzI0COPf4oI1IcCphQsiWINQQy6FMCwI\ng100P8EOMM5zG7bIIAtQjenzfr8JoKUPhWWQ6PZG5QKBgQDxHin0F0+nJuN8UeuF\npaz9oCf2UkA8VaxjkY4EzyzrbNEfVgDoK5sR8RDiwEqCSiw23YaeQ7G9L6E5BlHO\nmVIvbS6G3Jr2x7MyBsFhK1cPljsAgpH3WXLX5gDJtrTKBBX3+ZR5x1B0RJVKjTjf\n389L4PzZ4ZI27+TZ0WTDtUw5/QKBgQDlyTHHtjQfgQwuh4MNuuxxkNnM00L3ku6l\nHo+MeMwyZ7HJvuwJPvSlY8ZGZeVjTfG43J/nQRaYtB0QbDIpuHDCRSv2LQwvWVAB\nQ3uET2kbCEy1V+gdFKIdfpie7n8Br85PXvl4b3wAyqcaYstH4qRIGcY904ug4Jrn\ntDxJTSmzmwKBgQCghfNqVOaroqFKkANb25va0ngobkPjpyn4s9u36fG+3pgu44QB\nDZ7UiAg03c39BcJ/2GWaEflPuVj9bO6ju8FSX77c/BuS9gqf4I130nHIp7yqL0Nc\nSEnD4JVftWqRH708dQVbOc2fSlWV54UYzpjkrGnJ6Hn+ZyGVvej2vkl8RQKBgELj\nRwdQZWnKQcaFkcN8ZvlD5fJ2iKbScX9FHxoPy7jccGc+mSyz07kVCxFQ9e3rMXLT\nXgSN8Mrwmwk9xXhZhRE3220kfciGogBMKXdBOmIxD0s2VI2qhOo7AKg62mOeTlrS\nVaIWKa19UBkhKvU45wNJ5Wf33UwuNUk/MNFRkdMDAoGAJskYR21/reHcCcVjKwz2\nlj7IiveFzwFhxQGcrT0/rB0LOnx8bmOB2wZkfV5Yv5Uv7yNVr0k3pALjMWvIkiKg\nCSn/VRqPTx/B3ZDTAhDYcLUIuWv1oEq116qGJ4QOoG4YepzOW4tNLfhOy4eJgycg\niEZuGb9SFWVkAvG4698HMDI=\n-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-46oin@dreamelevenclone.iam.gserviceaccount.com",
  client_id: "112825361472499369847",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-46oin%40dreamelevenclone.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
// Add a new document with a generated id.
module.exports.addLivecommentary = async function addcommentry() {
  try {
    let date = new Date();
    const matchess = [];
    const endDate = new Date(date.getTime() + 10 * 60 * 60 * 1000);
    date = new Date(date.getTime() - 10 * 60 * 60 * 1000);
    const matches = await Matches.find({
      date: {
        $gte: new Date(date),
        $lt: new Date(endDate),
      },
    });
    for (let i = 0; i < matches.length; i++) {
      const matchid = matches[i].matchId;
      const match = await MatchLiveDetails.findOne({ matchId: matchid });
      if (match && !(match?.result == "Yes")) {
        matchess.push(matches[i]);
      }
    }
    for (let i = 0; i < matchess.length; i++) {
      if (matchess[i].cmtMatchId.length > 3) {
        const keys = await getkeys.getkeys();
        const options = {
          method: "GET",
          url: `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchess[i].matchId}/comm`,
          headers: {
            "X-RapidAPI-Key": keys,
            "X-RapidAPI-Host": "cricbuzz-cricket.p.rapidapi.com",
          },
        };
        try {
          const washingtonRef = doc(db, "cities", matchess[i].matchId);
          const response = await axios.request(options);
          const docRef = doc(db, "cities", matchess[i].matchId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
          } else {
            // docSnap.data() will be undefined in this case
            console.log("No such document!");
          }
          const a = response.data.commentaryList[0];
          if (docSnap?.data()?.capital) {
            await setDoc(washingtonRef, {
              capital: [...docSnap.data().capital, a],
            });
          } else {
            await setDoc(washingtonRef, {
              capital: [a],
            });
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  const res = await db.collection("cities").add({
    name: "bangalore",
    country: "karnataka",
  });
  return res;
};
