'use client'

import {
  IconDotsVertical,
  IconLogout,
  IconUserCircle
} from '@tabler/icons-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Achievements } from '@/components/achievements'

export function PlayerInfo() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={'lg'}
            className="bg-white border-4 p-6 border-black
                     hover:bg-yellow-100 text-black
                     transition-all duration-200
                     shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]
                     hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.3)]
                     hover:-translate-x-0.5 hover:-translate-y-0.5
                     font-bold relative overflow-hidden"
          >
            <div className="absolute inset-0 pop-art-dots opacity-20" />
            <Avatar className="h-8 w-8 rounded-lg border-2 border-black relative z-10">
              <AvatarImage
                src={session?.user.image || ''}
                alt={session?.user.name}
              />
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-yellow-400 to-pink-500 font-black">
                CN
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight relative z-10">
              <span className="truncate font-black text-black uppercase">
                {session?.user.name}
              </span>
              <span className="text-black/70 truncate text-xs font-semibold">
                {session?.user.email}
              </span>
            </div>
            <IconDotsVertical className="ml-auto size-4 text-black relative z-10" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl
                   bg-white border-4 border-black
                   shadow-[8px_8px_0_0_rgba(0,0,0,0.3)]
                   relative overflow-hidden"
          align="end"
          sideOffset={8}
        >
          <div className="absolute inset-0 pop-art-dots opacity-10" />
          <DropdownMenuLabel className="p-0 font-normal relative z-10">
            <div className="flex items-center gap-3 px-3 py-3 text-left text-sm border-b-4 border-black">
              <Avatar className="h-10 w-10 rounded-lg border-2 border-black">
                <AvatarImage
                  src={session?.user.image || ''}
                  alt={session?.user.name}
                />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-yellow-400 to-pink-500 font-black">
                  CN
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-black text-black uppercase">
                  {session?.user.name}
                </span>
                <span className="text-black/70 truncate text-xs font-semibold">
                  {session?.user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-black h-1" />
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="gap-3 text-black hover:bg-yellow-100 cursor-pointer transition-colors font-bold relative z-10 px-4 py-3"
          >
            <IconUserCircle className="w-5 h-5" />
            <Achievements />
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-3 text-black hover:bg-red-100 hover:text-red-600 cursor-pointer transition-colors font-bold relative z-10 px-4 py-3"
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push('/login')
                  }
                }
              })
            }
          >
            <IconLogout className="w-5 h-5" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
