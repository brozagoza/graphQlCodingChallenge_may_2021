/**
 * Coding Challenge 5/18/2021.
 * Twitter like API that allows users to sign up, sign in, and sign out.
 * A user can post messages once signed in.
 * Anyone can query for messages for any user based on their uid.
 */

// TODO: Don't use multiple firebase imports. Bad practice.
// @ts-ignore
import firebase from "firebase";
import UserCredential = firebase.auth.UserCredential;

const firebase = require('firebase'),
    admin = require('firebase-admin'),
    express = require('express'),
    functions = require('firebase-functions'),
    {graphqlHTTP} = require("express-graphql"),
    {buildSchema} = require("graphql");

// Initialization
admin.initializeApp();
firebase.default.initializeApp({
    // Omitted for public repo
});
const app = express();

enum HtmlCodes {
    SUCCESS = 200,
    FAILURE = 500
}

enum FirebaseCollections {
    USERS = "users",
    MESSAGES = "messages"
}

/**
 * TODO: Should not be storing user credentials server-side.
 * This should be done client-side since any calls to API would use the same user.
 * Hacky work around to not have to deal with session cookies being thrown around for coding challenge.
 */
let user: firebase.User | null;

const schema = buildSchema(`
    type User {
        uid: String!
        displayName: String
        messages: [Message]
        followers: [User]
        following: [User]
    }
    type Message {
        id: String!
        message: String!
        user: String!
        likes: [String]
    }

    # API Responses
    interface Response {
        code: Int!
        responseMessage: String
    }
    type SignUpWithEmailResponse implements Response {
        uid: String!
        code: Int!
        responseMessage: String
    }
    type SignInWithEmailResponse implements Response {
        uid: String!
        code: Int!
        responseMessage: String
    }
    type PostMessageResponse implements Response {
        message: String!
        code: Int!
        responseMessage: String
    }
    type SignOutResponse implements Response {
        code: Int!
        responseMessage: String
    }
    type GetMessagesFromUserByUidResponse implements Response {
        messages: [Message]
        code: Int!
        responseMessage: String
    }

    # Queries to fetch data
    type Query {
        getMessagesFromUserByUid(uid: String!): GetMessagesFromUserByUidResponse
    }
    
    # Mutation APIs to alter data
    type Mutation {
        signUpWithEmail (
            email: String!
            password: String!
            displayName: String
            phoneNumber: String
        ): SignUpWithEmailResponse
        signInWithEmail (
            email: String!
            password: String!
        ): SignInWithEmailResponse
        signOut: SignOutResponse
        postMessage (
            message: String!
        ): PostMessageResponse
    }
`);


const root = {
    // Queries
    getMessagesFromUserByUid: async ({ uid }: { uid: string}) => {
        console.log("getMessagesFromUserByUid called.");
        const messages : any = [];

        try {
            const queryResult = await admin.firestore().collection(FirebaseCollections.MESSAGES)
                .where("user", "==", uid).get();

            const queryResultDocs = queryResult.docs;
            for (let i = 0; i < queryResultDocs.length; i++) {
                console.log(queryResultDocs[i].data());
                messages.push(queryResultDocs[i].data());
            }

            console.log("Successfully queried for messages.");

            return { messages,  code: HtmlCodes.SUCCESS, responseMessage: "Successfully queried for messages."}
        } catch (error) {
            throw new Error(`Error when posting message. Error: ${error}`);
        }
    },
    // Mutations
    postMessage: async ({message}: { message: string }) => {
        console.log("postMessage called");

        if (!user) {
            return {code: HtmlCodes.FAILURE, responseMessage: "No user signed in."};
        }

        try {
            await admin.firestore().collection(FirebaseCollections.MESSAGES).add({
                id: `${user.uid}_${Date.now()}`,
                user: user.uid,
                message,
                likes: [], // TODO: uids of other users who liked this message
            });
        } catch (error) {
            throw new Error(`Error when posting message. Error: ${error}`);
        }

        return {message, code: HtmlCodes.SUCCESS, responseMessage: "User successfully created."};
    },
    signUpWithEmail: async (
        {email, password, displayName = ""}
            : { email: string, password: string, displayName: string, phoneNumber: string }) => {

        console.log("signUpWithEmail called. Parameters omitted for privacy.");

        try {
            console.log("Calling firebase createUser");
            const userRecord = await admin.auth().createUser({
                email,
                emailVerified: false,
                displayName,
                password,
                disabled: false,
            });

            console.log("createUser succeeded. Creating firebase collections entry in users");
            const uid = userRecord.uid;

            const writeResult = await admin.firestore().collection(FirebaseCollections.USERS).doc(uid)
                .set({
                    uid,
                    displayName: userRecord.displayName,
                    messages: [],
                    followers: [],
                    following: []
                });

            console.log(`Firebase Collection write succeeded. Write result: ${writeResult}`);
            return {code: HtmlCodes.SUCCESS, uid, responseMessage: "User successfully created."};
        } catch (error) {
            throw new Error(`Error when signing up user with email. Error: ${error}`);
        }
    },
    signInWithEmail: async ({email, password}: { email: string, password: string }) => {
        console.log("signInWithEmail called. Parameters omitted for privacy");

        try {
            const userCredential : UserCredential = await firebase.default.auth().signInWithEmailAndPassword(email, password);
            user = userCredential.user;

            console.log("Successfully signed in.");

            return {code: HtmlCodes.SUCCESS, uid: user?.uid, responseMessage: "User successfully created."};
        } catch (error) {
            user = null;
            throw new Error(`Error when signing in user with email. Error: ${error}`);
        }
    },
    signOut: async () => {
        console.log("signOut called.");
        try {
            await firebase.default.auth().signOut();
            user = null;
            console.log("Successfully signed out.");

            return { code: HtmlCodes.SUCCESS, responseMessage: "User successfully signed out."};
        } catch (error) {
            throw new Error(`Error when signing out. Error: ${error}`);
        }
    },
};

app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true
}));

export const api = functions.https.onRequest(app);
