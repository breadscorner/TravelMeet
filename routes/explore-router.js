const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { fetchSingleEvent, filterEventImages, getGroups, totalNumberOfPeopleForEvent } = require('../services/events-services');
const { getPost, getRelatedPosts } = require('../services/posts-services');
const prisma = new PrismaClient();
const { ensureAuthenticated } = require('../passport-middleware/check-auth');

router.get('/', async (req, res) => {
    const users = await prisma.user.findMany();
    res.render('./explore-views/explore', { users: users });
}
);

// Feeds post page
router.get('/feeds/:id', ensureAuthenticated, async (req, res) => {
    try {
        const postId = req.params.id;
        const postData = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });
        res.render('./explore-views/feeds-post', { post: postData });
    } catch (error) {
        console.log(error);
    }
});

// Event page
router.get('/event/:id', ensureAuthenticated, async (req, res) => {
    try {
        const eventData = await fetchSingleEvent(req.params.id);
        const eventImage = await filterEventImages(eventData.images);
        const groups = await getGroups(req.params.id);
        const totalNumberOfPeople = await totalNumberOfPeopleForEvent(groups);
        const eventImageURL = eventImage[0].url;
        res.render('./explore-views/event', {
            event: eventData,
            eventImageURL: eventImageURL,
            eventGroups: groups,
            totalNumberOfPeople: totalNumberOfPeople
        });
    } catch (error) {
        console.log(error);
    }
}
);

// Group page
router.get('/event/:eventId/group/:groupId', ensureAuthenticated, async (req, res) => {
    try {
        const eventData = await fetchSingleEvent(req.params.eventId);
        const eventImage = await filterEventImages(eventData.images);
        const groups = await getGroups(req.params.eventId);
        const totalNumberOfPeople = await totalNumberOfPeopleForEvent(groups);
        const group = await prisma.group.findUnique({
            where: {
                id: Number(req.params.groupId)
            },
            include: {
                creator: true,
                members: true
            }
        });
        res.render('./explore-views/group', {
            group: group,
            event: eventData, eventImageURL: eventImage[0].url,
            totalNumberOfPeople: totalNumberOfPeople,
            user: req.user
        });
    } catch (error) {
        console.log(error);
    }
}
);

// Create group page
router.post('/create-group/:eventId', ensureAuthenticated, async (req, res) => {
    try {
        await prisma.group.create({
            data: {
                name: req.body.groupName,
                creatorId: req.user.id,
                eventId: req.params.eventId,
                creatorMessage: req.body.creatorMessage,
            }
        });
        res.redirect(`/event/${req.params.eventId}`);
    } catch (error) {
        console.log(error);
    }
}
);

// Delete group
router.get('/delete-group/:groupId/:eventId', ensureAuthenticated, async (req, res) => {
    try {
        await prisma.group.delete({
            where: {
                id: Number(req.params.groupId)
            }
        });
        res.redirect(`/event/${req.params.eventId}`);
    } catch (error) {
        console.log(error);
    }
}
);

router.get('/posts/:id', ensureAuthenticated, async (req, res) => {
    const postId = Number(req.params.id);
    try {
        const postData = await getPost(postId);
        console.log(postData);
        const relatedPosts = await getRelatedPosts(postData.category, postId);
        res.render('./explore-views/feeds-post', { post: postData, relatedPosts: relatedPosts });
    }
    catch (error) {
        console.log(error);
    }
});

//Follow user
router.post('/follow/:id', async (req, res) => {
    try {
        const userToFollowId = Number(req.params.id);
        const currentUser = req.user;

        await prisma.user.update({
            where: { id: currentUser.id },
            data: { following: { connect: { id: userToFollowId } } }
        });

        res.status(200).json({ message: "Successfully followed" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred while trying to follow the user" });
    }
});

//Unfollow user
router.post('/unfollow/:id', async (req, res) => {
    try {
        const userToUnfollowId = Number(req.params.id);
        const currentUser = req.user;

        await prisma.user.update({
            where: { id: currentUser.id },
            data: { following: { disconnect: { id: userToUnfollowId } } }
        });

        res.status(200).json({ message: "Successfully unfollowed" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred while trying to unfollow the user" });
    }
});

// Check if following user
router.get('/is-following/:id', async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const currentUser = req.user;

        const isFollowing = await prisma.user.findFirst({
            where: { 
                id: currentUser.id,
                following: {
                    some: {
                        id: userId
                    }
                }
            }
        });

        if (isFollowing) {
            res.status(200).json({ isFollowing: true });
        } else {
            res.status(200).json({ isFollowing: false });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred while checking follow status" });
    }
});



module.exports = router;