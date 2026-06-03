const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const slugify = require('slugify');
const { urlDecode } = require('../../../helper/urlHelper');
const { deleteFile } = require('../../../helper/deleteHelper');
const { getParticularSiteSettingsModel, setSiteSettingsModel } = require('../../../model/admin/settings/adminSiteSettingsModel');
const { getPagesModel, getFaqPageModel, deleteFaqPageSettingsModel, createFaqPageSettingsModel, getSeoPageModel, createSeoPageSettingsModel, deleteSeoPageSettingsModel, getOfficeAddressModel, getContactChanelModel, setContactChanelModel, createOfficeAddressModel, deleteOfficeAddressModel } = require('../../../model/admin/settings/adminPageSettingsModal');


const getAllPages = asyncHandler(async (req, res, next) => {
    try {
        const pages = await getPagesModel({ is_active: 1, type: req?.body?.type });
        return res.status(200).json({ status: true, msg: 'All Page master details.', pages: pages })
    } catch (error) {
        next(error)
    }
})

const setSiteSettings = asyncHandler(async (req, res, next) => {
    try {
        const data = req.body;
        const payload = {
            site_title: data?.site_title,
            meta_description: data?.meta_description,
            meta_keywords: data?.meta_keywords,
            og_title: data?.og_title,
            og_description: data?.og_description,
            og_url: data?.og_url,
            og_type: data?.og_type,
            og_site_name: data?.og_site_name,
            twitter_card: data?.twitter_card,
            twitter_title: data?.twitter_title,
            twitter_description: data?.twitter_description,
            robots_meta: data?.robots_meta,
            canonical_url: data?.canonical_url
        }

        const perticularSiteSettings = await getParticularSiteSettingsModel({ id: 1 });
        const files = req.files || {};
        if (files.site_logo) {
            if (perticularSiteSettings[0].site_logo) {
                deleteFile(perticularSiteSettings[0].site_logo)
            }
            payload.site_logo = files.site_logo[0].path;
        }
        if (files.site_favicon) {
            if (perticularSiteSettings[0].site_favicon) {
                deleteFile(perticularSiteSettings[0].site_favicon)
            }
            payload.site_favicon = files.site_favicon[0].path;
        }
        if (files.og_image) {
            if (perticularSiteSettings[0].og_image) {
                deleteFile(perticularSiteSettings[0].og_image)
            }
            payload.og_image = files.og_image[0].path;
        }
        if (files.twitter_image) {
            if (perticularSiteSettings[0].twitter_image) {
                deleteFile(perticularSiteSettings[0].twitter_image)
            }
            payload.twitter_image = files.twitter_image[0].path;
        }

        const sitesettings = await setSiteSettingsModel(payload, { id: 1 });
        if (!sitesettings) {
            return res.status(400).json({ status: false, msg: 'Site Settings is not updated. Please add required fields' });
        }
        return res.status(200).json({ status: true, msg: 'Site Settings has been created successfully.' })
    } catch (error) {
        next(error)
    }
})

const getFaqPage = asyncHandler(async (req, res, next) => {
    try {
        const faqs = await getFaqPageModel({ 'page_master.id': req?.body?.page_id });
        return res.status(200).json({ status: true, msg: 'All Page master details.', faqs: faqs });
    } catch (error) {
        next(error);
    }
})

const setFaqPageSettings = asyncHandler(async (req, res, next) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ status: false, msg: 'Faq page is not updated. Please add required fields' });
        }
        await deleteFaqPageSettingsModel({ page_id: urlDecode(data?.page_id) });
        const response = Promise.all(data?.question?.map(async (element, index) => {
            const payload = {
                question: element,
                answer: data?.answer[index],
                sort_order: data?.sort_order[index] || 1,
                page_id: urlDecode(data?.page_id)
            }
            await createFaqPageSettingsModel(payload);
        }));

        if (!response) {
            return res.status(400).json({ status: false, msg: 'Faq page is not updated. Please add required fields' });
        }
        return res.status(200).json({ status: true, msg: 'Faq page has been created successfully.' })
    } catch (error) {
        next(error)
    }
})

const getSeoPage = asyncHandler(async (req, res, next) => {
    try {
        const seos = await getSeoPageModel({ 'page_master.id': req?.body?.page_id });
        return res.status(200).json({ status: true, msg: 'All Page master details.', seos: seos.length > 0 ? seos[0] : null });
    } catch (error) {
        next(error);
    }
})

const setSeoPageSettings = asyncHandler(async (req, res, next) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ status: false, msg: 'Faq page is not updated. Please add required fields' });
        }

        await deleteSeoPageSettingsModel({ page_id: urlDecode(data?.page_id) });
        const payload = {
            meta_title: data?.meta_title,
            meta_description: data?.meta_description,
            meta_keywords: data?.meta_keywords,
            og_title: data?.og_title,
            page_id: urlDecode(data?.page_id)
        }
        const response = await createSeoPageSettingsModel(payload);

        if (!response) {
            return res.status(400).json({ status: false, msg: 'SEO page is not updated. Please add required fields' });
        }
        return res.status(200).json({ status: true, msg: 'SEO page has been created successfully.' })
    } catch (error) {
        next(error)
    }
})

const getAllOfficeAddress = asyncHandler(async (req, res, next) => {
    try {
        const offices = await getOfficeAddressModel();
        const contactChanel = await getContactChanelModel();
        return res.status(200).json({ status: true, msg: 'All Page master details.', offices: offices, contacts: contactChanel.length > 0 && contactChanel[0] })
    } catch (error) {
        next(error)
    }
})

const setContactChanel = asyncHandler(async (req, res, next) => {
    try {
        const data = req.body;
        const payload = {
            phone_1: data?.phone_1,
            phone_2: data?.phone_2,
            email: data?.email,
            whatsapp_link: data?.whatsapp_link,
            availability_hours: data?.availability_hours
        }
        const contactChanel = await setContactChanelModel(payload, { id: 1 });
        if (!contactChanel) {
            return res.status(400).json({ status: false, msg: 'Contact details is not updated. Please add required fields' });
        }
        return res.status(200).json({ status: true, msg: 'Contact details has been created successfully.' })
    } catch (error) {
        next(error)
    }
})

const createOfficeAddress = asyncHandler(async (req, res, next) => {
    try {
        const data = req.body;
        const payload = {
            office_type: data?.office_type,
            address: data?.address,
            map_direction_link: data?.map_direction_link
        }
        const officeAddress = await createOfficeAddressModel(payload);
        if (!officeAddress) {
            return res.status(400).json({ status: false, msg: 'Office Address is not updated. Please add required fields' });
        }
        return res.status(200).json({ status: true, msg: 'Office Address has been created successfully.' })
    } catch (error) {
        next(error)
    }
})

const deleteOfficeAddress = asyncHandler(async (req, res, next) => {
    try {
        const data = req.body;
        const officeAddress = await deleteOfficeAddressModel({id: req?.query?.id});
        if (!officeAddress) {
            return res.status(400).json({ status: false, msg: 'Office Address is not deleted. Please add required fields' });
        }
        return res.status(200).json({ status: true, msg: 'Office Address has been deleted successfully.' })
    } catch (error) {
        next(error)
    }
})

module.exports = {
    getAllPages,
    setSiteSettings,
    getFaqPage,
    setFaqPageSettings,
    getSeoPage,
    setSeoPageSettings,
    getAllOfficeAddress,
    setContactChanel,
    createOfficeAddress,
    deleteOfficeAddress
}