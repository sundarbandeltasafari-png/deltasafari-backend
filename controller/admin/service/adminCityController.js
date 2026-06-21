const asyncHandler = require('express-async-handler');
const md5 = require('md5');

var slugify = require('slugify');
const { urlDecode } = require('../../../helper/urlHelper');
const { deleteFile } = require('../../../helper/deleteHelper');
const { getParticularCityModel, getAllCityConditionModel, updateCityModel, getSearchCityModel, getCityStatusModel, createCityModel, getAllCountriesConditionModel } = require('../../../model/admin/service/adminCityModel');


const getAllCity = asyncHandler(async (req, res, next) => {
    try {
        let cities = await getAllCityConditionModel();
        cities = cities.map((city) => ({ ...city, city_image: city?.city_image?.replace(/\\/g, '/') }))
        return res.status(200).json({ status: true, msg: 'All cities..', cities: cities })
    } catch (error) {
        next(error)
    }
})

const getAllCountries = asyncHandler(async (req, res, next) => {
    try {
        let countries = await getAllCountriesConditionModel();
        return res.status(200).json({ status: true, msg: 'All countries..', countries: countries })
    } catch (error) {
        next(error)
    }
})

const getParticularCity = asyncHandler(async (req, res, next) => {
    try {
        const cityId = req?.query?.id && urlDecode(req?.query?.id);
        if (!cityId) {
            return res.status(400).json({ status: false, msg: 'Permision Id is not valid.' })
        }
        const city = await getParticularCityModel({ id: cityId });
        return res.status(200).json({ status: true, msg: 'city..', city: city })
    } catch (error) {
        next(error)
    }
})

const createCity = asyncHandler(async (req, res, next) => {
    const adminUser = req?.user;
    try {
        if (!req?.body?.name || !req?.body?.country || !req?.body?.state || req.files['city_image'].length == 0) {
            return res.status(400).json({ status: false, msg: 'Please enter valid city details.' })
        }
        const cityData = {
            name: req?.body?.name,
            country: req?.body?.country,
            state: req?.body?.state,
            show_in_package: req?.body?.show_in_package,
            show_in_corporate: req?.body?.show_in_corporate,
            show_in_hotel: req?.body?.show_in_hotel,
            show_in_cab: req?.body?.show_in_cab,
            city_image: null,
            slug: slugify(req?.body?.name, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }),
        }

        if (req.files['city_image'] && req.files['city_image'].length > 0) {
            cityData.city_image = req.files['city_image'][0].path;
        }

        const city = await createCityModel(cityData);
        if (city.length == 0) {
            return res.status(400).json({ status: false, msg: 'Something went wrong when creating city, Please try again later.' })
        };
        return res.status(200).json({ status: true, msg: 'City created successfully..', city: city })
    } catch (error) {
        next(error)
    }
})

const updateCity = asyncHandler(async (req, res, next) => {
    try {
        if (!req?.body?.name || !req?.body?.country || !req?.body?.state) {
            return res.status(400).json({ status: false, msg: 'Please enter valid city details.' })
        }
        const cityId = req?.body?.cityId && urlDecode(req?.body?.cityId);
        if (!cityId) {
            return res.status(400).json({ status: false, msg: 'City is not valid.' })
        }
        const particulerCity = await getParticularCityModel({ id: cityId });
        const cityData = {
            name: req?.body?.name,
            country: req?.body?.country,
            state: req?.body?.state,
            show_in_package: req?.body?.show_in_package,
            show_in_corporate: req?.body?.show_in_corporate,
            show_in_hotel: req?.body?.show_in_hotel,
            show_in_cab: req?.body?.show_in_cab,
            slug: slugify(req?.body?.name, { replacement: '-', remove: undefined, lower: true, strict: false, locale: 'vi', trim: true }),
        }
        if (req.files['city_image'] && req.files['city_image'].length > 0) {
            cityData.city_image = req.files['city_image'][0].path;
            if (particulerCity?.city_image) {
                await deleteFile(particulerCity?.city_image);
            }
        }
        const cities = await updateCityModel(cityData, { id: cityId });
        return res.status(200).json({ status: true, msg: 'cities updated successfully..', city: cities })
    } catch (error) {
        next(error)
    }
})

const deleteCity = asyncHandler(async (req, res, next) => {
    try {
        if (!req?.body?.id) {
            return res.status(400).json({ status: false, msg: 'Please select a valid city.' })
        }
        const cityId = req?.body?.id && urlDecode(req?.body?.id);
        if (!cityId) {
            return res.status(400).json({ status: false, msg: 'Epaper is not valid.' })
        }
        const particulerCity = await getParticularCityModel({ id: cityId });
        if (particulerCity?.city_image) {
            await deleteFile(particulerCity?.city_image);
        }
        const cities = await deleteCityModel({ id: cityId });
        return res.status(200).json({ status: true, msg: 'Post update successfully.', cities: cities })
    } catch (error) {
        next(error)
    }
})


module.exports = {
    getAllCity,
    getParticularCity,
    createCity,
    updateCity,
    deleteCity,
    getAllCountries
}