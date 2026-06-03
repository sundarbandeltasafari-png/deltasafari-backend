const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const slugify = require('slugify');
const { urlDecode } = require('../../../helper/urlHelper');
const { deleteFile } = require('../../../helper/deleteHelper');
const { getParticularSiteSettingsModel, setSiteSettingsModel } = require('../../../model/admin/settings/adminSiteSettingsModel');


const getParticularSiteSettings = asyncHandler(async (req, res, next) => {
    try {
        const siteSettings = await getParticularSiteSettingsModel({ id: 1 });
        return res.status(200).json({ status: true, msg: 'Paricular site settings data.', siteSettings: siteSettings ?? siteSettings[0] })
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

module.exports = {
    getParticularSiteSettings,
    setSiteSettings
}