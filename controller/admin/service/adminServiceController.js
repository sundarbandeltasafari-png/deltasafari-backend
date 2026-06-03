const asyncHandler = require('express-async-handler');
const md5 = require('md5');
const { getAllContactsModel } = require('../../../model/admin/service/adminServiceModel');
// const { getStudyProfileModel, getAllLanguagesModel, createLanguageModel, setLanguageModel, deleteLanguageModel, createStudyProfileModel, setStudyProfileModel, deleteStudyProfileModel, createSubjectModel, setSubjectModel, deleteSubjectModel, getAllSubjectsModel, getAllSubscriptionModel, createSubscriptionModel, setSubscriptionModel, deleteSubscriptionModel, getUserSubscriptionsModel, getSearchHistoryModel, getSubscriptionsModel, getDashboardSubscriptionModel, getDashboardSubscriptionModelByDate, getDashboardSearchModel, getDashboardSearchModelByDate, getDashboardSearchModelOccurance, getAllContactsModel } = require('../../../model/admin/service/adminServiceModel');

// // Subscriptions
// const getAllSubscriptionPackage = asyncHandler(async (req, res) => {
//     try {
//         const subscriptions = await getAllSubscriptionModel();
//         return res.status(200).json({ status: true, msg: 'All Subscriptions..', subscriptions: subscriptions })
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
//     }
// })

// const createSubscriptionPackage = asyncHandler(async (req, res) => {
//     try {
//         if (!req?.body) {
//             return res.status(400).json({ status: false, msg: 'Please enter a valid subscription.' })
//         }
//         // console.log(req?.body)
//         const subscriptions = await createSubscriptionModel(req?.body);
//         return res.status(200).json({ status: true, msg: 'subscription created successfully..', subscriptions: subscriptions })
//     } catch (error) {
//         return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
//     }
// })

// const setSubscriptionPackage = asyncHandler(async (req, res) => {
//     try {
//         if (!req?.body) {
//             return res.status(400).json({ status: false, msg: 'Please enter a valid subscription.' })
//         }
//         const subscriptions = await setSubscriptionModel(req?.body, req?.body?.id);
//         return res.status(200).json({ status: true, msg: 'subscription update successfully.', subscriptions: subscriptions })
//     } catch (error) {
//         return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
//     }
// })

// const deleteSubscriptionPackage = asyncHandler(async (req, res) => {
//     try {
//         if (!req?.body?.id) {
//             return res.status(400).json({ status: false, msg: 'Please enter a valid subscription id.' })
//         }
//         const subscriptions = await deleteSubscriptionModel(req?.body?.id);
//         return res.status(200).json({ status: true, msg: 'subscription update successfully.', subscriptions: subscriptions })
//     } catch (error) {
//         return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
//     }
// })

// const userDetails = asyncHandler(async (req, res) => {
//     try {
//         if (!req?.body?.id) {
//             return res.status(400).json({ status: false, msg: 'Please enter a valid user id.' })
//         }
//         const userData = await getParticularUserById(req?.body?.id);
//         // const userSubscription = await getUserSubscriptionModel(req?.body?.id);
//         return res.status(200).json({ status: true, msg: 'User Details fetched successfully.', userDetails: { ...userData[0], password: '' } })
//     } catch (error) {
//         // console.log(error)
//         return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
//     }
// })

// const getUserSubscriptionHistory = asyncHandler(async (req, res) => {
//     try {
//         if (!req?.body?.id) {
//             return res.status(400).json({ status: false, msg: 'Please enter a valid user id.' })
//         }
//         const subscriptionHistory = await getUserSubscriptionsModel(req?.body?.id);
//         return res.status(200).json({ status: true, msg: 'User Subscriptions.', subscriptionHistory: subscriptionHistory })
//     } catch (error) {
//         return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
//     }
// })

// const getUserSubscription = asyncHandler(async (req, res) => {
//     try {
//         if (!req?.body?.id) {
//             return res.status(400).json({ status: false, msg: 'Please enter a valid user id.' })
//         }
//         const mysubscription = await getUserSubscriptionModel(req?.body?.id);
//         // const currentPackage = await 
//         return res.status(200).json({ status: true, msg: 'User Subscriptions.', subscription: mysubscription.length > 0 ? mysubscription[0] : null })

//     } catch (error) {
//         return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
//     }
// })

// const getUserSearchHistory = asyncHandler(async (req, res) => {
//     try {
//         if (!req?.body?.id) {
//             return res.status(400).json({ status: false, msg: 'Please enter a valid user id.' })
//         }
//         const history = await getSearchHistoryModel(req?.body?.id);
//         return res.status(200).json({ status: true, msg: 'All Search Histories..', history: history })
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
//     }
// })

// const getSubscriptionHistory = asyncHandler(async (req, res) => {
//     try {
//         const subscriptionHistory = await getSubscriptionsModel();
//         // console.log(subscriptionHistory)
//         return res.status(200).json({ status: true, msg: 'User Subscriptions.', subscriptionHistory: subscriptionHistory })
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
//     }
// })

// const getAdminDashboard = asyncHandler(async (req, res) => {
//     try {
//         if (req?.user) {
//             const users = await getAllUsersModel();
//             // console.log(users)
//             const date = new Date()
//             const subscription = await getDashboardSubscriptionModel();
//             const subscriptionByYearDate = await getDashboardSubscriptionModelByDate(date.getFullYear());
//             const subscriptionByMonthDate = await getDashboardSubscriptionModelByDate(`${date.getFullYear()}-${date.getMonth() + 1 > 9 ? (date.getMonth() + 1) : "0" + (date.getMonth() + 1)}`);
//             const dashboardSearch = await getDashboardSearchModel();
//             const dashboardSearchByYearDate = await getDashboardSearchModelByDate(date.getFullYear());
//             const dashboardSearchByPreviousYearDate = await getDashboardSearchModelByDate(date.getFullYear()-1);
//             const dashboardSearchByMonthDate = await getDashboardSearchModelByDate(`${date.getFullYear()}-${date.getMonth() + 1 > 9 ? (date.getMonth() + 1) : "0" + (date.getMonth() + 1)}`);
//             const dashboardSearchOccuranceMedium = await getDashboardSearchModelOccurance('medium');
//             const dashboardSearchOccuranceGrade = await getDashboardSearchModelOccurance('grade');
//             const dashboardSearchOccuranceSubject = await getDashboardSearchModelOccurance('subject');
    
//             const adminDashboardObj = {
//                 total_users: users.length,
//                 total_subscriptions: subscription[0]?.total,
//                 total_income: subscription[0]?.amount,
//                 total_subscription_year: subscriptionByYearDate[0]?.amount,
//                 total_subscription_month: subscriptionByMonthDate[0]?.amount,
//                 total_dashboardSearch: dashboardSearch[0].total,
//                 total_dashboardSearch_year: dashboardSearchByYearDate[0]?.total,
//                 total_dashboardSearch_previous_year: dashboardSearchByPreviousYearDate[0]?.total,
//                 total_dashboardSearch_month: dashboardSearchByMonthDate[0]?.total,
//                 total_medium: dashboardSearchOccuranceMedium,
//                 total_grade: dashboardSearchOccuranceGrade,
//                 total_subject: dashboardSearchOccuranceSubject,
//             }
//             return res.status(200).json({ status: true, msg: 'All Search Histories..', adminDashboardObj: adminDashboardObj })
//         } else {
//             return res.status(400).json({ status: false, msg: 'User not found!' });
//         }
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
//     }
// })

//  Contact list
const getAllContactList = asyncHandler(async (req, res) => {
    try {
        const contacts = await getAllContactsModel();
        return res.status(200).json({ status: true, msg: 'All Contacts.', contacts: contacts })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ status: false, msg: 'Something went wrong! Please try again later.' })
    }
})


module.exports = {
    // getStudyProfile,
    // getAllLanguage,
    // createLanguage,
    // setLanguage,
    // deleteLanguage,
    // createStudyProfile,
    // setStudyProfile,
    // deleteStudyProfile,
    // getAllSubject,
    // createSubject,
    // setSubject,
    // deleteSubject,
    // getAllSubscriptionPackage,
    // createSubscriptionPackage,
    // setSubscriptionPackage,
    // deleteSubscriptionPackage,
    // userDetails,
    // getUserSubscriptionHistory,
    // getUserSearchHistory,
    // getSubscriptionHistory,
    // getAdminDashboard,
    // getUserSubscription,
    getAllContactList
}