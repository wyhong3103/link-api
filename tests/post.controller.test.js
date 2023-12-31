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
        .send({"content" : "test", "markdown" : "false", "math" : "true"});

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
                    author : {
                        _id : userA._id.toString(),
                        first_name : "User",
                        last_name : "A",
                        image : ""
                    },
                    markdown : false,
                    math : true,
                    comments : [],
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

    test("A: Create another post", async () => {
        const res1 = 
        await agent
        .post('/post')
        .send({"content" : "test", "markdown" : false, "math" : true});

        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        
        const res2 = 
        await agent
        .get(`/user/${userA._id}`)

        expect(res2.body.user.posts).toHaveLength(2);
        expect(res2.body.user.posts[1]).toEqual(
            expect.objectContaining(
                {
                    content : "test",
                    markdown : false,
                    math : true
                }
            )
        )
    })    
    
    test("A: Get all posts", async () => {
        const res1 = 
        await agent
        .get(`/post/`)

        expect(res1.status).toEqual(200);
        expect(res1.body.posts).toHaveLength(2);
    })

    test("A: Update post", async () => {
        const res1 = 
        await agent
        .get(`/post`)

        const post_id = res1.body.posts[0]._id;

        const res2 = 
        await agent
        .put(`/post/${post_id}`)
        .send({"content" : "updated content", "markdown" : true, "math" : true});

        expect(res2.status).toEqual(200);

        const post = await Post.findById(post_id).exec();

        expect(post).toEqual(
            expect.objectContaining(
                {
                    content : "updated content",
                    markdown : true,
                    math : true
                }
            )
        )
    })

    test("B: Read post that is from A (and make friend with user A)", async () => {
        await login('b');

        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();

        userA.friends.push(userB._id);
        userB.friends.push(userA._id);

        await userA.save();
        await userB.save();

        const res1 = 
        await agent
        .get(`/post/`)


        expect(res1.body.posts).toHaveLength(2);
    })

    test("B: Update post that is from A", async () => {
        const res1 = 
        await agent
        .get(`/post`)

        const post_id = res1.body.posts[0]._id;

        const res2 = 
        await agent
        .put(`/post/${post_id}`)
        .send({"content" : "updated content by B", "markdown" : "true", "math" : "true"});

        expect(res2.status).toEqual(403);

        const post = await Post.findById(post_id).exec();

        expect(post).toEqual(
            expect.objectContaining(
                {
                    content : "updated content",
                    markdown : true,
                    math : true
                }
            )
        )
    })

    test("B: Delete post that is from A", async () => {
        const res1 = 
        await agent
        .get(`/post`)

        const post_id = res1.body.posts[0]._id;

        const res2 = 
        await agent
        .delete(`/post/${post_id}`)

        expect(res2.status).toEqual(403);

        const post = await Post.findById(post_id).exec();

        expect(post).toEqual(
            expect.objectContaining(
                {
                    content : "updated content",
                    markdown : true,
                    math : true
                }
            )
        )
    })

    test("B: Delete post that is from A", async () => {
        const res1 = 
        await agent
        .get(`/post`)

        const post_id = res1.body.posts[0]._id;

        const res2 = 
        await agent
        .delete(`/post/${post_id}`)

        expect(res2.status).toEqual(403);

        const post = await Post.findById(post_id).exec();

        expect(post).toEqual(
            expect.objectContaining(
                {
                    content : "updated content",
                    markdown : true,
                    math : true
                }
            )
        )
    })

    test("A: Delete post", async () => {
        await login('a');
        const res1 = 
        await agent
        .get(`/post`)

        const post_id = res1.body.posts[0]._id;

        const res2 = 
        await agent
        .delete(`/post/${post_id}`)

        expect(res2.status).toEqual(200);

        const post = await Post.findById(post_id).exec();

        expect(post).toEqual(null);
    })

    test("A & B: Like post", async () => {
        const res1 = await agent.get(`/post`)

        const post_id = res1.body.posts[0]._id;

        await agent
        .post(`/post/${post_id}/like`)

        await login('b');

        await agent
        .post(`/post/${post_id}/like`)

        const post = await Post.findById(post_id).exec();

        expect(post.likes).toHaveLength(2);
    })

    test("B: Like more than one time", async () => {
        const res1 = await agent.get(`/post`)

        const post_id = res1.body.posts[0]._id;

        await agent
        .post(`/post/${post_id}/like`)

        await agent
        .post(`/post/${post_id}/like`)

        const post = await Post.findById(post_id).exec();

        expect(post.likes).toHaveLength(2);
    })

    test("B: Unlike post", async () => {
        const res1 = await agent.get(`/post`)

        const post_id = res1.body.posts[0]._id;

        await agent
        .delete(`/post/${post_id}/like`)

        const post = await Post.findById(post_id).exec();

        const userA = await User.findOne({email : "user_a@test.com"}).exec();
        const userB = await User.findOne({email : "user_b@test.com"}).exec();

        expect(post.likes).toContainEqual(userA._id);
        expect(post.likes).not.toContainEqual(userB._id);
    })

    test("B : Comment post", async () => {
        const res1 = await agent.get(`/post`)

        const post_id = res1.body.posts[0]._id;

        const res2 = await agent
        .post(`/post/${post_id}/comment`)
        .send({content : "test comment", markdown : true, math : true});

        expect(res2.status).toEqual(200);

        const post = await Post.findById(post_id).exec();
        expect(post.comments).toHaveLength(1);

        const res3 = await agent.get(`/post`);
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        expect(res3.body.posts[0].comments[0].author._id.toString()).toEqual(userB._id.toString());
        expect(res3.body.posts[0].comments[0].content).toEqual("test comment");
    })

    test("B : Update comment", async () => {
        const res1 = await agent.get(`/post`)

        const post_id = res1.body.posts[0]._id;

        const comment_id = res1.body.posts[0].comments[0]._id;

        const res2 = await agent
        .put(`/post/${post_id}/comment/${comment_id}`)
        .send({content : "updated comment", markdown : true, math : true});

        expect(res2.status).toEqual(200);

        const post = await Post.findById(post_id).exec();
        expect(post.comments).toHaveLength(1);

        const res3 = await agent.get(`/post`);
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        expect(res3.body.posts[0].comments[0].author._id.toString()).toEqual(userB._id.toString());
        expect(res3.body.posts[0].comments[0].content).toEqual("updated comment");
    })

    test("A : Update comment from B", async () => {
        await login('a');
        const res1 = await agent.get(`/post`)

        const post_id = res1.body.posts[0]._id;

        const comment_id = res1.body.posts[0].comments[0]._id;

        const res2 = await agent
        .put(`/post/${post_id}/comment/${comment_id}`)
        .send({content : "updated comment A", markdown : true, math : true});

        expect(res2.status).toEqual(403);

        const post = await Post.findById(post_id).exec();
        expect(post.comments).toHaveLength(1);

        const res3 = await agent.get(`/post`);
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        expect(res3.body.posts[0].comments[0].author._id.toString()).toEqual(userB._id.toString());
        expect(res3.body.posts[0].comments[0].content).toEqual("updated comment");
    })

    test("A : Delete comment from B", async () => {
        await login('a');
        const res1 = await agent.get(`/post`)

        const post_id = res1.body.posts[0]._id;

        const comment_id = res1.body.posts[0].comments[0]._id;

        const res2 = await agent
        .delete(`/post/${post_id}/comment/${comment_id}`)

        expect(res2.status).toEqual(403);

        const post = await Post.findById(post_id).exec();
        expect(post.comments).toHaveLength(1);

        const res3 = await agent.get(`/post`);
        const userB = await User.findOne({email : "user_b@test.com"}).exec();
        expect(res3.body.posts[0].comments[0].author._id.toString()).toEqual(userB._id.toString());
        expect(res3.body.posts[0].comments[0].content).toEqual("updated comment");
    })

    test("B : Delete comment from B", async () => {
        await login('b');
        const res1 = await agent.get(`/post`)

        const post_id = res1.body.posts[0]._id;

        const comment_id = res1.body.posts[0].comments[0]._id;

        const res2 = await agent
        .delete(`/post/${post_id}/comment/${comment_id}`)

        expect(res2.status).toEqual(200);

        const post = await Post.findById(post_id).exec();
        expect(post.comments).toHaveLength(0);
    })
})