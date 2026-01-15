import {RegisterForm} from "@/components/rigister-form";

const Page = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="w-full max-w-md">
                {/* Pop art title decoration */}
                <div className="mb-8 text-center relative">
                    <div className="absolute -left-8 -top-4 w-24 h-24 bg-yellow-400/30 rounded-full blur-2xl -z-10" />
                    <div className="absolute -right-8 -bottom-4 w-20 h-20 bg-pink-500/30 rounded-full blur-2xl -z-10" />
                    <h1 className="text-5xl font-black tracking-tight mb-2 relative">
                        <span className="absolute -left-2 -top-1 text-yellow-400 blur-sm opacity-50">SIGN UP</span>
                        <span className="relative bg-gradient-to-r from-yellow-400 via-pink-500 via-blue-500 to-green-400 bg-clip-text text-transparent">
                            SIGN UP
                        </span>
                    </h1>
                    <div className="flex items-center justify-center gap-3 mt-3">
                        <div className="h-1 w-16 bg-gradient-to-r from-yellow-400 to-pink-500" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-green-400" />
                    </div>
                </div>
                <RegisterForm/>
            </div>
        </div>
    )
}

export default Page