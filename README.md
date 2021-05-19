# 5/18/2021 Coding Challenge.
Coding challenge provided by comapny to create a simple Node.js graphQl api.
## Features
- Twitter like API that allows users to sign up, sign in, and sign out.
- A user can post messages once signed in.
- Anyone can query for messages for any user based on their uid.

## Usage
This API uses Firebase for it's authentication, database, and hosting.
This API is deployed to Firebase Functions and can easily be accessed with GraphiQL with the below link:

https://us-central1-point-graphql-project.cloudfunctions.net/api/graphql

### Input / Output
Note: Code = HTML Response code.
```$xslt
mutation {
  signUpWithEmail(email: "someemail@gmail.com", password: "123456", displayName: "name") {
    uid,
    code,
    responseMessage
  }
  
  signInWithEmail(email: "someemail@gmail.com", password: "123456") {
    uid,
    code,
    responseMessage
  }
  
  // signIn must be called prior 
  postMessage(message: "hello world") {
    message,
    code,
    responseMessage
  }
  
  signOut {
    code,
    responseMessage
  }
}

query {
  getMessagesFromUserByUid(uid: "aabbccddeeffgg") {
    messages {
      id,
      message,
      likes
    },
    code,
    responseMessage
  }
}
```