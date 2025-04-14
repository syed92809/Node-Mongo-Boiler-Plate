import firebase from "firebase-admin";

import serviceAccount from "./serviceAccountKeys.json" with { type: "json" };

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount)
});

export default firebase;



// const sendNotification = async (message, token) => {
//     firebase.messaging().send({
//         token,
//         notification: {
//             title: 'New Notification',
//             body: message,
//         },
//     }).then((response) => {
//         console.log('Successfully sent message:', response);
//     }).catch((error) => {
//         console.log('Error sending message:', error);
//     });
// };