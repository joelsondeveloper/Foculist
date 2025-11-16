import 'next-auth'

declare module 'next-auth' {
    interface Session {
        user?: {
            id: string;
            name?: string | null
            email?: string | null
            image?: string | null
            plan: 'free' | 'premium';
        } & DefaultSession['user'];
    }

    interface User {
        id: string;
        plan: 'free' | 'premium';
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
    }
}