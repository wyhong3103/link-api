const app = require('./app_test');
const mongo = require('./mongo_config_test');
const request = require('supertest');
const authService = require('../services/auth.service');
const User = require('../models/user');

//run test
describe("User Controller Test", () => {
    const agent = request.agent(app);

    // Set up mongoDB
    beforeAll(
        async () => {
            await mongo.connect();
            const user1 = new User({
                first_name : "User",
                last_name : "A",
                email : "user_a@test.com",
                password : authService.hashPassword("testtest"),
                image : ""
            })

            const user2 = new User({
                first_name : "User",
                last_name : "B",
                email : "user_b@test.com",
                password : authService.hashPassword("testtest"),
                image : ""
            })

            const user3 = new User({
                first_name : "User",
                last_name : "C",
                email : "user_c@test.com",
                password : authService.hashPassword("testtest"),
                image : ""
            })

            await user1.save();
            await user2.save();
            await user3.save();
        }
    )

    afterAll(
        async () => {
            await mongo.closeDatabase();
        }
    )

    const login = async (user) => {
        const res = 
        await agent
        .post('/auth/login')
        .send({email : `user_${user}@test.com`, password : "testtest"})
    };

    test("A: Get all users", async () => {
        await login('a');
        const res = await agent.get('/user').set('Accept', 'application/json');
        expect(res.status).toEqual(200);
        const test = res.body.users.map((i) => {
            return {
                first_name : i.first_name,
                last_name : i.last_name,
                image : i.image,
                type : i.type
            }
            }
        );
        expect(test).toEqual(
            [
                {
                    first_name : "User",
                    last_name : "A",
                    image : "",
                    type : 'self'
                },
                {
                    first_name : "User",
                    last_name : "B",
                    image : "",
                    type : 'stranger'
                },
                {
                    first_name : "User",
                    last_name : "C",
                    image : "",
                    type : 'stranger'
                }
            ]
        );
    })

    test("A: Get self", async () => {
        const user = await User.findOne({email : "user_a@test.com"}).exec();
        const res = await agent.get(`/user/${user._id}`).set('Accept', 'application/json');

        expect(res.status).toEqual(200);
        expect(res.body.user).toEqual(
            expect.objectContaining(
                {
                    first_name : "User" ,
                    last_name : "A",
                    image : "",
                    friends : [],
                    posts : [],
                    friend_requests : [],
                    type : 'self'
                }
            )
        );
    })

    test("A: Get non-self user", async () => {
        const user = await User.findOne({email : "user_b@test.com"}).exec();
        const res = await agent.get(`/user/${user._id}`).set('Accept', 'application/json');

        expect(res.status).toEqual(200);
        expect(res.body.user).not.toHaveProperty("friend_requets");
        expect(res.body.user).toEqual(
            expect.objectContaining(
                {
                    first_name : "User" ,
                    last_name : "B",
                    image : "",
                    friends : [],
                    posts : [],
                    type : 'stranger'
                }
            )
        );
    })    
    
    
    test("A: Send friend request", async () => {
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        const res = 
        await agent
        .post(`/user/${userB._id}/friend-request`)

        expect(res.status).toEqual(200);
    })

    test("A: Get B relationship type (sent)", async () => {
        const user = await User.findOne({email : "user_b@test.com"}).exec();
        const res = await agent.get(`/user/${user._id}`).set('Accept', 'application/json');

        expect(res.status).toEqual(200);
        expect(res.body.user).not.toHaveProperty("friend_requets");
        expect(res.body.user).toEqual(
            expect.objectContaining(
                {
                    first_name : "User" ,
                    last_name : "B",
                    image : "",
                    friends : [],
                    posts : [],
                    type : 'sent'
                }
            )
        );
    })  
    
    test("A: Send friend request to self", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const res = 
        await agent
        .post(`/user/${userA._id}/friend-request`)

        expect(res.status).toEqual(400);
    })

    test("B: Send friend request from B to A (after A sent)", async () => {
        await login('b');
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const res = 
        await agent
        .post(`/user/${userA._id}/friend-request`)

        expect(res.status).toEqual(400);
    })    
    
    test("B: Get A relationship type (accept)", async () => {
        const user = await User.findOne({email : "user_a@test.com"}).exec();
        const res = await agent.get(`/user/${user._id}`).set('Accept', 'application/json');

        expect(res.status).toEqual(200);
        expect(res.body.user).not.toHaveProperty("friend_requets");
        expect(res.body.user).toEqual(
            expect.objectContaining(
                {
                    first_name : "User" ,
                    last_name : "A",
                    image : "",
                    friends : [],
                    posts : [],
                    type : 'accept'
                }
            )
        );
    })  

    test("B: Accept friend request", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        const res = 
        await agent
        .post(`/user/${userB._id}/friend-request/${userA._id}`)

        expect(res.status).toEqual(200);

        const newUserA = await User.findOne({email : "user_a@test.com"}).exec();
        const newUserB = await User.findOne({email : "user_b@test.com"}).exec();

        expect(newUserA.friends.map(i => i._id)).toContainEqual(userB._id);
        expect(newUserB.friends.map(i => i._id)).toContainEqual(userA._id);
    })

    test("B: Get A relationship type (friend)", async () => {
        const self = await User.findOne({email : "user_b@test.com"}).exec();
        const user = await User.findOne({email : "user_a@test.com"}).exec();
        const res = await agent.get(`/user/${user._id}`).set('Accept', 'application/json');

        expect(res.status).toEqual(200);
        expect(res.body.user).not.toHaveProperty("friend_requets");
        expect(res.body.user).toEqual(
            expect.objectContaining(
                {
                    first_name : "User" ,
                    last_name : "A",
                    image : "",
                    friends : [
                        {
                            _id : self._id.toString(),
                            first_name : 'User',
                            last_name : 'B',
                            image : '',
                            type : 'self'
                        }
                    ],
                    posts : [],
                    type : 'friend'
                }
            )
        );
    })  

    test("C: Delete friendship of A and B as C", async () => {
        await login('c');
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();

        const res = 
        await agent
        .delete(`/user/${userA._id}/friend/${userB._id}`)

        expect(res.status).toEqual(403);
    })

    test("B: Delete friend A from B", async () => {
        await login('b');
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        const res = 
        await agent
        .delete(`/user/${userB._id}/friend/${userA._id}`)

        expect(res.status).toEqual(200);

        const newUserA = await User.findOne({email : "user_a@test.com"}).exec();
        const newUserB = await User.findOne({email : "user_b@test.com"}).exec();

        expect(newUserA.friends).not.toContainEqual(userB._id);
        expect(newUserB.friends).not.toContainEqual(userA._id);
    })

    test("B: Delete friend A from B (after unfriend)", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        const res = 
        await agent
        .delete(`/user/${userB._id}/friend/${userA._id}`)

        expect(res.status).toEqual(404);
    })

    test("B: Delete friend request (that B send to A) from B ", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        await agent
        .post(`/user/${userA._id}/friend-request`)

        const res = 
        await agent
        .delete(`/user/${userA._id}/friend-request/${userB._id}`)

        expect(res.status).toEqual(200);

        const newUserA = await User.findOne({email : "user_a@test.com"}).exec();

        expect(newUserA.friend_requests).not.toContainEqual(userB._id);
    })

    test("A: Delete friend request (that B send to A) from A", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        await agent
        .post(`/user/${userA._id}/friend-request`)

        await login('a');

        const res = 
        await agent
        .delete(`/user/${userA._id}/friend-request/${userB._id}`)

        expect(res.status).toEqual(200);

        const newUserA = await User.findOne({email : "user_a@test.com"}).exec();

        expect(newUserA.friend_requests).not.toContainEqual(userB._id);
    })

    test("A: Delete friend request that doesn't exist", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();

        const res = 
        await agent
        .delete(`/user/${userA._id}/friend-request/${userB._id}`)

        expect(res.status).toEqual(404);
    })    
    
    test("A: Delete friend that doesn't exist", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();

        const res = 
        await agent
        .delete(`/user/${userA._id}/friend/${userB._id}`)

        expect(res.status).toEqual(404);
    })

    test("A: Delete friend that doesn't exist", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();

        const res = 
        await agent
        .delete(`/user/${userA._id}/friend/${userB._id}`)

        expect(res.status).toEqual(404);
    })


    test("A: Change password", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const res = 
        await agent
        .put(`/user/${userA._id}/password`)
        .send(
            {
                old_password : "testtest",
                new_password : "testtest1",
                new_repassword : "testtest1"
            }
        )

        expect(res.status).toEqual(200);

        const newUserA = await User.findOne({email : "user_a@test.com"}).exec();

        expect(authService.verifyPassword("testtest1", newUserA.password)).toEqual(true);
    })

    test("A: Change password with wrong old password", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const res = 
        await agent
        .put(`/user/${userA._id}/password`)
        .send(
            {
                old_password : "testtest",
                new_password : "testtest1",
                new_repassword : "testtest1"
            }
        )

        expect(res.status).toEqual(403);
    })

    test("A: Change password with password that does not match with confirmation", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const res = 
        await agent
        .put(`/user/${userA._id}/password`)
        .send(
            {
                old_password : "testtest",
                new_password : "testtest",
                new_repassword : "testtest1"
            }
        )

        expect(res.status).toEqual(400);
    })

    test("A: Change password of other user", async () => {
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        const res = 
        await agent
        .put(`/user/${userB._id}/password`)
        .send(
            {
                old_password : "testtest",
                new_password : "testtest1",
                new_repassword : "testtest1"
            }
        )

        expect(res.status).toEqual(403);
    })

    test("A: Update first name and last name", async () => {
        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const res = 
        await agent
        .put(`/user/${userA._id}`)
        .send(
            {
                first_name : "User",
                last_name : "a",
                delete_image : false
            }
        )

        expect(res.status).toEqual(200);

        const newUserA = await User.findOne({email : "user_a@test.com"}).exec();

        expect(newUserA.last_name).toEqual('a');
    })


})
