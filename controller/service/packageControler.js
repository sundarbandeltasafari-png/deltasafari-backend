const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getHomePackagesModel, getDestinationsModel, getAllPackageItinerariesModel, getAllPackagePoliciesModel, getParticularPackageModel, createBookingsModel, getFilteredPackagesModel, getCitiesModel, getAllCitiesModel, getAllPackageTypesModel, searchAllModel, getDiscountedPackagesModel } = require('../../model/service/packageModel');
const { urlDecode } = require('../../helper/urlHelper');
const { getAllPackageAssetsModel } = require('../../model/admin/package/adminPackageModel');

const getAllPackageType = asyncHandler(async (req, res, next) => {
    try {
        const packageTypes = await getAllPackageTypesModel(req?.body ? {...req?.body, status: 1} : { status: 1 });
        return res.status(200).json({ status: true, msg: 'All PackageTypes..', packageTypes: packageTypes })
    } catch (error) {
        next(error)
    }
})

const getHomePackages = asyncHandler(async (req, res) => {
    try {
        const domestic = await getHomePackagesModel({ pkg_type: 1 });
        const international = await getHomePackagesModel({ pkg_type: 2 });
        return res.status(200).json({ status: true, msg: 'Top trending and top destination', domestic: domestic, international: international })
    } catch (error) {
        console.log(error);

        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getDestinations = asyncHandler(async (req, res) => {
    try {
        const condition = req?.body?.condition || (req?.query && Object.keys(req.query).length > 0 ? req.query : undefined) || (req?.body && Object.keys(req.body).length > 0 ? req.body : undefined);
        const destinations = await getDestinationsModel(condition);
        return res.status(200).json({ status: true, msg: 'All destinations...', destinations: destinations })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getCities = asyncHandler(async (req, res) => {
    try {
        if (!req?.body?.condition) {
            return res.status(401).json({ status: false, msg: 'Please add condition' })
        }
        const cities = await getCitiesModel(req?.body?.condition);
        console.log(cities);
        
        return res.status(200).json({ status: true, msg: 'All cities...', cities: cities })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getAllCities = asyncHandler(async (req, res) => {
    try {
        const condition = req?.body?.condition || (req?.body && Object.keys(req.body).length > 0 ? req.body : undefined);
        const cities = await getAllCitiesModel(condition);
        return res.status(200).json({ status: true, msg: 'All cities...', cities: cities })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})

const getParticularPackage = asyncHandler(async (req, res, next) => {
    try {
        const packageId = req.query?.id && urlDecode(req?.query?.id);
        const slug = req.query?.slug;

        let packageData = [];
        if (slug) {
            packageData = await getParticularPackageModel({ "packages_master.slug": slug });
            if ((!packageData || packageData.length === 0) && slug) {
                const decodedSlug = decodeURIComponent(slug);
                if (decodedSlug !== slug) {
                    packageData = await getParticularPackageModel({ "packages_master.slug": decodedSlug });
                }
            }
        }

        if ((!packageData || packageData.length === 0) && packageId) {
            packageData = await getParticularPackageModel({ "packages_master.id": packageId });
        }

        const package = packageData && packageData.length > 0 ? packageData[0] : null;
        if (!package) {
            return res.status(400).json({ status: false, msg: 'There is no package found!' });
        }
        package.itineraries = await getAllPackageItinerariesModel({ package_id: package?.id });
        package.assets = await getAllPackageAssetsModel({ package_id: package?.id });
        package.policies = await getAllPackagePoliciesModel({ package_id: package?.id });
        return res.status(200).json({ status: true, msg: 'Here is your package, book now!', package: package });
    } catch (error) {
        next(error);
    }
});

const createBookings = asyncHandler(async (req, res) => {
    try {
        if (!req?.body) {
            return res.status(401).json({ status: false, msg: 'Please add valid details for booking' });
        }
        const booking = await createBookingsModel(req?.body);
        if (booking && booking.insertId) {
            const customerUserId = req.body?.user_id || req.user?.id || req.body?.userId;
            const packageId = req.body?.package_id || req.body?.packageId;
            if (customerUserId && packageId) {
                const { processReferralCommission } = require('../user/userController');
                processReferralCommission(booking.insertId, customerUserId, packageId).catch((err) => {
                    console.error("Error in processReferralCommission:", err);
                });
            }

            // Send Mailjet Booking Confirmation Email
            const recipientEmail = req.body?.email || (req.user ? req.user.email : null);
            const recipientName = req.body?.full_name || req.body?.name || (req.user ? `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() : 'Valued Traveler');
            if (recipientEmail) {
                const { sendBookingConfirmationEmail } = require('../../helper/serviceHelper');
                sendBookingConfirmationEmail(recipientEmail, recipientName, {
                    id: booking.insertId,
                    package_name: req.body?.package_name || req.body?.title || req.body?.destination || 'Safari Package',
                    travel_date: req.body?.travel_date || req.body?.departure_date || 'Scheduled Date',
                    passengers: req.body?.adults_count || req.body?.adults || 1,
                    amount: req.body?.amount || req.body?.price || req.body?.total_price
                });
            }
        }
        return res.status(200).json({ status: true, msg: 'Booking request registered successfully!', booking: booking });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' });
    }
});

const getFilteredPackages = asyncHandler(async (req, res, next) => {
    try {
        const destination = req.query?.destination || req.body?.destination;
        const name = req.query?.name || req.body?.name;
        const category = req.query?.category || req.body?.category;
        const city = req.query?.city || req.body?.city;
        const lastId = req.query?.lastId || req.body?.lastId;

        const filters = {};
        if (destination && destination.toString().trim() !== '') filters.destination = destination.toString().trim();
        if (name && name.toString().trim() !== '') filters.name = name.toString().trim();
        if (category && category.toString().trim() !== '') filters.category = category.toString().trim();
        if (city && city.toString().trim() !== '') filters.city = city.toString().trim();
        if (lastId && lastId.toString().trim() !== '') filters.lastId = lastId.toString().trim();

        const packages = await getFilteredPackagesModel(filters);
        return res.status(200).json({ status: true, msg: 'Filtered packages fetched successfully.', packages: packages })
    } catch (error) {
        next(error)
    }
})

const searchAll = asyncHandler(async (req, res, next) => {
    try {
        const search = req?.query?.search || req?.query?.q || req?.body?.search || req?.body?.q || req?.body?.searchData || '';
        
        if (!search || search.toString().trim() === '') {
            return res.status(200).json({ 
                status: true, 
                msg: 'Search query is empty.', 
                results: [],
                groupedResults: { cities: [], zones: [], packages: [] }
            });
        }

        const results = await searchAllModel(search.toString().trim());
        
        const groupedResults = {
            cities: results.filter(item => item.type === 'city'),
            zones: results.filter(item => item.type === 'zone'),
            packages: results.filter(item => item.type === 'package')
        };

        return res.status(200).json({ 
            status: true, 
            msg: 'Search results fetched successfully.', 
            results: results,
            groupedResults: groupedResults 
        });
    } catch (error) {
        next(error);
    }
});

const getDiscountedPackages = asyncHandler(async (req, res, next) => {
    try {
        const limit = req.query?.limit || req.body?.limit || 6;
        const packages = await getDiscountedPackagesModel(limit);
        return res.status(200).json({ status: true, msg: 'Discounted packages fetched successfully.', packages: packages });
    } catch (error) {
        next(error);
    }
});

module.exports = { getHomePackages, getDestinations, getParticularPackage, createBookings, getFilteredPackages, getCities, getAllCities, getAllPackageType, searchAll, getDiscountedPackages };