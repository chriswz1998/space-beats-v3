'use client'

import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {authClient} from "@/lib/auth-client";
import {toast} from "sonner";
import Image from "next/image";

const loginSchema = z.object({
    email: z.email('Please enter valid email address'),
    password: z.string().min(1, 'Password is required')
})

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const router = useRouter()

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    })

    const onSubmit = async (values: LoginFormValues) => {
        await authClient.signIn.email({
            email: values.email,
            password: values.password,
            callbackURL: '/'
        }, {
            onSuccess: () => {
                router.push("/");
            },
            onError: (ctx) => {
                toast.error(ctx.error.message);
            }
        })
    }

    const signInGithub = async () => {
        await authClient.signIn.social({
            provider: "github"
        }, {
            onSuccess: () => {
                router.push("/");
            },
            onError: () => {
                toast.error('something went wrong');
            }
        })
    }

    const signInGoogle = async () => {
        await authClient.signIn.social({
            provider: "google"
        }, {
            onSuccess: () => {
                router.push("/");
            },
            onError: () => {
                toast.error('something went wrong');
            }
        })
    }

    const isPending = form.formState.isSubmitting

    return (
        <div className="flex flex-col gap-6">
            <Card className="bg-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 pop-art-dots opacity-20" />
                <CardHeader className="text-center relative z-10 pb-6 border-b-4 border-black">
                    <CardTitle className="text-3xl font-black text-black uppercase mb-2">Welcome Back</CardTitle>
                    <CardDescription className="text-black/70 font-bold text-base">Login to continue</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 relative z-10">
                   <Form {...form}>
                       <form onSubmit={form.handleSubmit(onSubmit)}>
                           <div className="grid gap-6">
                               <div className="flex flex-col gap-4">
                                   <Button
                                       variant='outline'
                                       className='w-full bg-white border-4 border-black 
                                                hover:bg-yellow-100 hover:border-yellow-400
                                                text-black font-black uppercase
                                                shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]
                                                hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.3)]
                                                hover:-translate-x-0.5 hover:-translate-y-0.5
                                                transition-all duration-200
                                                py-6'
                                       type='button'
                                       disabled={isPending}
                                       onClick={signInGithub}
                                   >
                                       <Image src='/github.svg' width={20} height={20} alt={'Github'} className="mr-2" />
                                       Continue with GitHub
                                   </Button>
                                   <Button
                                       variant='outline'
                                       className='w-full bg-white border-4 border-black 
                                                hover:bg-pink-100 hover:border-pink-400
                                                text-black font-black uppercase
                                                shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]
                                                hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.3)]
                                                hover:-translate-x-0.5 hover:-translate-y-0.5
                                                transition-all duration-200
                                                py-6'
                                       type='button'
                                       disabled={isPending}
                                       onClick={signInGoogle}
                                   >
                                       <Image src='/google.svg' width={20} height={20} alt={'Google'} className="mr-2" />
                                       Continue with Google
                                   </Button>
                               </div>
                               <div className="relative">
                                   <div className="absolute inset-0 flex items-center">
                                       <div className="w-full border-t-2 border-black"></div>
                                   </div>
                                   <div className="relative flex justify-center text-sm">
                                       <span className="bg-white px-4 text-black font-black uppercase">OR</span>
                                   </div>
                               </div>
                               <div className='grid gap-6'>
                                   <FormField
                                       control={form.control}
                                       name="email"
                                       render={({ field }) => (
                                           <FormItem>
                                               <FormLabel className="text-black font-black uppercase text-sm">Email</FormLabel>
                                               <FormControl>
                                                   <Input 
                                                       placeholder="m@exa.com" 
                                                       type='email' 
                                                       {...field}
                                                       className="bg-white border-4 border-black rounded-lg
                                                                focus:border-yellow-400 focus:ring-0
                                                                text-black font-semibold
                                                                shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]
                                                                py-6"
                                                   />
                                               </FormControl>
                                               <FormMessage className="text-red-600 font-bold" />
                                           </FormItem>
                                       )}
                                   />
                                   <FormField
                                       control={form.control}
                                       name="password"
                                       render={({ field }) => (
                                           <FormItem>
                                               <FormLabel className="text-black font-black uppercase text-sm">Password</FormLabel>
                                               <FormControl>
                                                   <Input 
                                                       placeholder="*********" 
                                                       type='password' 
                                                       {...field}
                                                       className="bg-white border-4 border-black rounded-lg
                                                                focus:border-pink-400 focus:ring-0
                                                                text-black font-semibold
                                                                shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]
                                                                py-6"
                                                   />
                                               </FormControl>
                                               <FormMessage className="text-red-600 font-bold" />
                                           </FormItem>
                                       )}
                                   />
                                   <Button 
                                       type='submit' 
                                       className='w-full bg-gradient-to-r from-yellow-400 via-pink-500 to-blue-500 
                                                hover:from-yellow-300 hover:via-pink-400 hover:to-blue-400
                                                text-black font-black text-lg uppercase
                                                border-4 border-black
                                                shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]
                                                hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.3)]
                                                hover:-translate-x-0.5 hover:-translate-y-0.5
                                                transition-all duration-200
                                                py-6' 
                                       disabled={isPending}
                                   >
                                       Login
                                   </Button>
                               </div>
                               <div className="text-center text-sm pt-4 border-t-4 border-black">
                                   <span className="text-black font-bold">Don&#39;t have an account? </span>
                                   <Link href="/signup" className='text-pink-600 font-black uppercase hover:text-blue-600 transition-colors'>
                                       Sign up
                                   </Link>
                               </div>
                           </div>
                       </form>
                   </Form>
                </CardContent>
            </Card>
        </div>
    )
}