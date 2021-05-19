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

### Tech Debt
- Since this was my first time actually building out a GraphQL API, I learned that it may be better to have used
`GraphQLSchema` instead of `buildSchema`. Mostly used this for the quickness, but later implementations would
transition to whatever is cleaner.
- 2 firebase authentications were used since this server-side API was to handle a user's logged in session.
I performed a hacky way to maintain a session, but this should be handled with a session cookie and that cookie
should be stored or passed around from the client-side.
- There's probably a more efficient way to query for messages than my current implementation (adding a 2nd index?).
Mostly did what I did based off the firebase docs.

### Future Roadmap
- Build out likes feature.
- Build out following/followers.
- Build out messages with multimedia data.

### Pros / Cons
Pros of my approach:
- It was quick and moderately clean so that it could fit on the `index.ts` file.
- Firebase has easy out-of-the-box tools/services that make standing up a service like this "almost prod" ready.
- Because of Firebase, I'm able to have it run on functions so it can be hit without local setup.

Cons:
- Firebase is a bit limited in it's services offerings. GCP or AWS would be much better long term.
- User Sessions not properly handled.
- Did everything in a single file for readability, but this doesn't scale. Would distribute out constants, util classes,
APIs, etc. out to their own domain specific folders/files.
