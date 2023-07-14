const app = require('./app_test');
const mongo = require('./mongo_config_test');
const request = require('supertest');
const authService = require('../services/auth.service');
const User = require('../models/user');
const Post = require('../models/post');

//run test
describe("Post Controller Test", () => {
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

    test("A: Create post and check existence of post in User", async () => {
        await login('a');
        const res1 = 
        await agent
        .post('/post')
        .send({"content" : "test", "markdown" : "false", "math" : "true", "delete_image" : "false"});

        expect(res1.status).toEqual(200);

        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        
        const res2 = 
        await agent
        .get(`/user/${userA._id}`)

        expect(res2.body.user).toHaveProperty("posts");
        expect(res2.body.user.posts).toHaveLength(1);

        expect(res2.body.user.posts[0]).toEqual(
            expect.objectContaining(
                {
                    content : "test",
                    markdown : false,
                    math : true,
                    comments : [],
                    image : ""
                }
            )
        )
    });

    test("A: Create post and omit necessary details", async () => {
        const res1 = 
        await agent
        .post('/post')
        .send({"content" : "test", "markdown" : "false"});

        expect(res1.status).toEqual(401);

        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        
        const res2 = 
        await agent
        .get(`/user/${userA._id}`)

        expect(res2.body.user.posts).toHaveLength(1);
    })    
    
    test("A: Create post and delete non-existing image", async () => {
        const res1 = 
        await agent
        .post('/post')
        .send({"content" : "test 1", "markdown" : "false", "math" : "true", "delete_image" : "true"});

        expect(res1.status).toEqual(200);

        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        
        const res2 = 
        await agent
        .get(`/user/${userA._id}`)

        expect(res2.body.user.posts).toHaveLength(2);
    });
})