const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getHomeDestinationModel, getContactDetailsModel, getOfficeDetailsModel, getFAQModel, getHomePostsModel } = require('../../model/service/commonModel');

const getHomeDestination = asyncHandler(async (req, res) => {
    try {
        const topDesination = await getHomeDestinationModel({ top_destination: 1 });
        const topTrending = await getHomeDestinationModel({ top_trending: 1 });
        const faqs = await getFAQModel({ page_id: 1 });
        return res.status(200).json({ status: true, msg: 'Top trending and top destination', topTrending: topTrending, topDesination: topDesination, faqs: faqs })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getHomePosts = asyncHandler(async (req, res) => {
    try {
        const posts = await getHomePostsModel({ status: 1 });
        return res.status(200).json({ status: true, msg: 'Top trending and top destination', posts: posts })
    } catch (error) {
        console.log(error);
        
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getContactDetails = asyncHandler(async (req, res) => {
    try {
        const offices = await getOfficeDetailsModel();
        const contacts = await getContactDetailsModel();
        const faqs = await getFAQModel({ page_id: 8 });
        return res.status(200).json({ status: true, msg: 'Top trending and top destination', offices: offices, contacts: contacts.length > 0 && contacts[0], faqs: faqs })
    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

module.exports = { getHomeDestination, getContactDetails, getHomePosts }