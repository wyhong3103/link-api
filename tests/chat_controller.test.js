const app = require('./app_test');
const mongo = require('./mongo_config_test');
const request = require('supertest');
const authService = require('../services/auth.service');
const chatService = require('../services/chat.service');
const User = require('../models/user');
const Chat = require('../models/post');

//run test
describe("Post Controller Test", () => {
    const agent = request.agent(app);

    // Set up mongoDB
    beforeAll(
        async () => {
            await mongo.connect();
            const user1 = await (new User({
                first_name : "User",
                last_name : "A",
                email : "user_a@test.com",
                password : authService.hashPassword("testtest"),
                image : ""
            })).save();

            const user2 = await (new User({
                first_name : "User",
                last_name : "B",
                email : "user_b@test.com",
                password : authService.hashPassword("testtest"),
                image : ""
            })).save();

            const user3 = await(new User({
                first_name : "User",
                last_name : "C",
                email : "user_c@test.com",
                password : authService.hashPassword("testtest"),
                image : ""
            })).save();

            await chatService.insertMessage(user1._id.toString(), user2._id.toString(), {
                content : "test message 1",
                author : user1._id.toString(),
                markdown : true,
                math : true,
                date : Date.now()
            });

            await chatService.insertMessage(user1._id.toString(), user2._id.toString(), {
                content : "test message 2",
                author : user2._id.toString(),
                markdown : true,
                math : true,
                date : Date.now()
            });
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

    test("A: Get chat message", async () => {
        await login('a');

        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();

        const res = 
        await agent
        .get(`/chat/${userA._id},${userB._id}`);

        expect(res.status).toEqual(200);

        expect(res.body.messages).toHaveLength(2);

        expect(res.body.messages[0]).toEqual(
            expect.objectContaining({
                content : "test message 1",
                author : {
                    _id : userA._id.toString(),
                    first_name : "User",
                    last_name : "A",
                    image : ""
                },
                markdown : true,
                math : true,
            })
        )

        expect(res.body.messages[1]).toEqual(
            expect.objectContaining({
                content : "test message 2",
                author : {
                    _id : userB._id.toString(),
                    first_name : "User",
                    last_name : "B",
                    image : ""
                },
                markdown : true,
                math : true,
            })
        )
    })

    test("B: Get chat message", async () => {
        await login('b');

        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();

        const res = 
        await agent
        .get(`/chat/${userB._id},${userA._id}`);

        expect(res.status).toEqual(200);

        expect(res.body.messages).toHaveLength(2);

        expect(res.body.messages[0]).toEqual(
            expect.objectContaining({
                content : "test message 1",
                author : {
                    _id : userA._id.toString(),
                    first_name : "User",
                    last_name : "A",
                    image : ""
                },
                markdown : true,
                math : true,
            })
        )

        expect(res.body.messages[1]).toEqual(
            expect.objectContaining({
                content : "test message 2",
                author : {
                    _id : userB._id.toString(),
                    first_name : "User",
                    last_name : "B",
                    image : ""
                },
                markdown : true,
                math : true,
            })
        )
    })

    test("C: Get chat message of A and B", async () => {
        await login('c');

        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();

        const res = 
        await agent
        .get(`/chat/${userA._id},${userB._id}`);

        expect(res.status).toEqual(403);
    })
})