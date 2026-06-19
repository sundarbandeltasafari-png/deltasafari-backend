
const asyncHandler = require('express-async-handler');
const md5 = require('md5');

const { getAllPostsModel, createPostModel, setPostModel, deletePostModel, getAllPostsConditionModel, getParticularPostsModel, createFeatureVideoModel, createPostsTagsModel, createTagsModel, deleteFeatureVideoModel, getParticularTagsModel, getPostTagsModel, updatePostModel, deletePostsTagsModel } = require('../../../model/admin/service/adminPostModel');
const slugify = require('slugify');
const { urlDecode } = require('../../../helper/urlHelper');
const { deleteFile } = require('../../../helper/deleteHelper');


const getAllPost = asyncHandler(async (req, res) => {
    try {
        const Post = await getAllPostsConditionModel({ status: 1 });
        return res.status(200).json({ status: true, msg: 'All Post..', posts: Post })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getPost = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.condition) {
            return res.status(400).json({ status: false, msg: 'Please enter valid Post.' })
        }
        const Post = await getAllPostsConditionModel(req?.body?.condition);
        return res.status(200).json({ status: true, msg: 'Post..', posts: Post })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


const getParticularPost = asyncHandler(async (req, res) => {
    try {
        const postId = req?.query?.id && urlDecode(req?.query?.id);
        if (!postId) {
            return res.status(400).json({ status: false, msg: 'Permision Id is not valid.' })
        }
        const tags = await getPostTagsModel({ 'post_tags.post_id': postId });
        const Post = await getParticularPostsModel({ id: postId });
        return res.status(200).json({ status: true, msg: 'Post..', post: Post, tags: tags })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const createPost = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.title && !req?.body?.summary && !req?.body?.content && !req?.body?.category_id && !req?.body?.featured_image) {
            return res.status(400).json({ status: false, msg: 'Please enter valid Post details.' })
        }
        const PostData = {
            title: req?.body?.title,
            summary: req?.body?.summary,
            content: req?.body?.content,
            author_id: req?.user?.id,
            slug: slugify(req?.body?.title, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }),
            category_id: req?.body?.category_id,
            status: req?.body?.status,
            featured_image: null,
        }
        if (req.files['featured_image'].length > 0) {
            PostData.featured_image = req.files['featured_image'][0].path;
        }
        if (req.files['featured_video'] && req.files['featured_video'].length > 0) {
            const video = await createFeatureVideoModel({ path: req.files['featured_video'][0].path });
            PostData.featured_video = video.insertId;
        }
        const Post = await createPostModel(PostData);
        if (Post.length == 0) {
            return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
        };
        if (req?.body?.tags) {
            Promise.all(req?.body?.tags.split(',').map(async (tag) => {
                var tags = await createTagsModel({ name: tag, slug: slugify(tag, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }) });
                var tagId = tags?.insertId;
                if (!tagId) {
                    const perticularTag = await getParticularTagsModel({ name: tag });
                    tagId = perticularTag?.id
                }
                await createPostsTagsModel({ post_id: Post.insertId, tag_id: tagId });
            }));
        }
        return res.status(200).json({ status: true, msg: 'Post created successfully..', Post: Post })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const updatePost = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.title && !req?.body?.summary && !req?.body?.content && !req?.body?.category_id && !req?.body?.featured_image) {
            return res.status(400).json({ status: false, msg: 'Please enter valid Post details.' })
        }
        const postId = urlDecode(req?.body?.post_id);
        const particulerPost = await getParticularPostsModel({ id: postId });
        const PostData = {
            title: req?.body?.title,
            summary: req?.body?.summary,
            content: req?.body?.content,
            author_id: req?.user?.id,
            slug: slugify(req?.body?.title, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }),
            category_id: req?.body?.category_id,
            status: req?.body?.status
        }

        if (req.files['featured_image'].length > 0) {
            PostData.featured_image = req.files['featured_image'][0].path;
            await deleteFile(particulerPost?.featured_image);
        }
        if (req.files['featured_video'] && req.files['featured_video'].length > 0) {
            const postVideo = await getParticularFeatureVideoModel({ id: particulerPost?.featured_video });
            const video = await createFeatureVideoModel({ path: req.files['featured_video'][0].path });
            PostData.featured_video = video.insertId;
            await deleteFeatureVideoModel({ id: particulerPost?.featured_video });
            await deleteFile(postVideo?.path)
        }
        const Post = await updatePostModel(PostData, { id: postId });

        if (req?.body?.tags) {
            await deletePostsTagsModel({ post_id: Post.insertId });
            Promise.all(req?.body?.tags.split(',').map(async (tag) => {
                var tags = await createTagsModel({ name: tag, slug: slugify(tag, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }) });
                var tagId = tags?.insertId;
                if (!tagId) {
                    const perticularTag = await getParticularTagsModel({ name: tag });
                    tagId = perticularTag?.id
                }
                await createPostsTagsModel({ post_id: Post.insertId, tag_id: tagId });
            }));
        }
        return res.status(200).json({ status: true, msg: 'Post updated successfully..', Post: Post })
    } catch (error) {
        console.log(error);
        
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const deletePost = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.id) {
            return res.status(400).json({ status: false, msg: 'Please enter a valid language.' })
        }
        const Post = await setPostModel({ status: 4 }, req?.body?.id);
        return res.status(200).json({ status: true, msg: 'Post update successfully.', Post: Post })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getPostTags = asyncHandler(async (req, res) => {
    try {
        const postId = req?.query?.id && urlDecode(req?.query?.id);
        if (!postId) {
            return res.status(400).json({ status: false, msg: 'Permision Id is not valid.' })
        }
        const tags = await getPostTagsModel({ 'post_tags.post_id': postId });
        return res.status(200).json({ status: true, msg: 'All tags..', tags: tags })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


module.exports = {
    getAllPost,
    createPost,
    deletePost,
    getParticularPost,
    updatePost,
    getPostTags
}