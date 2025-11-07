import { IUser } from "@/models/User";

export const isUserPremium = (user: IUser) => {
    if (!user || user.plan !== 'premium' || !user.subscriptionEndDate) return false;
    
    const now = new Date();
    const endDate = new Date(user.subscriptionEndDate);
    return now < endDate;
};