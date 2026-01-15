'use client'

import { IconMusic } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { PutBlobResult } from '@vercel/blob'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3']

const formSchema = z.object({
  file: z
    .instanceof(File, { message: 'please upload file' })
    .refine((file) => file.size <= MAX_FILE_SIZE, `file size under 20MB`)
    .refine((file) => ACCEPTED_AUDIO_TYPES.includes(file.type), 'mp3 file only')
})

export const UploadSong = () => {
  const { data: session } = authClient.useSession()
  const [loading, setLoading] = useState<boolean>(false)

  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    const file = values.file
    if (!file) {
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    const pythonRes = await fetch(
      'https://my-rhythm-game-api-b6hda7gybqekfkft.canadacentral-01.azurewebsites.net/analyze',
      {
        method: 'POST',
        body: formData
      }
    )

    if (!pythonRes.ok) {
      toast.error('Python analysis failed')
      setLoading(false)
      return
    }
    toast.success('Python analysis done!')

    const analysisData = await pythonRes.json()

    const res_url = await fetch(`/api/upload?filename=${file.name}`, {
      method: 'POST',
      body: file
    })

    if (!res_url.ok) {
      toast.error('audio upload failed')
      setLoading(false)
      return
    }
    toast.success('audio upload done!')

    const { url } = (await res_url.json()) as PutBlobResult

    const saveRes = await fetch('/api/song', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: file.name.replace(/\.[^/.]+$/, ''), // Strip extension for song name
        author: session?.user.name, // Consider a form field for custom author
        duration: analysisData.metadata.duration_sec,
        url,
        achievement: 'Standard Clear', // Default achievement label

        // Use the three arrays returned from Python
        easyChart: analysisData.easy,
        normalChart: analysisData.normal,
        hardChart: analysisData.hard
      })
    })

    if (!saveRes.ok) {
      toast.error('Upload final step failed!')
    }
    setLoading(false)
    router.refresh()

    toast.success('Upload & Analysis Complete!', {
      description: 'Your chart is ready.',
      duration: 2000
    })

    form.reset()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-8 flex items-center gap-8"
      >
        <FormField
          control={form.control}
          name="file"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem className="relative">
              <FormControl>
                <Input
                  {...fieldProps}
                  type="file"
                  accept="audio/mpeg, .mp3"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={(event) => {
                    const file = event.target.files && event.target.files[0]
                    if (file) {
                      onChange(file)
                    }
                  }}
                />
              </FormControl>
              {/* Visual layer (UI): pop art style */}
              <div className="relative">
                <div
                  className={`bg-white h-14 flex items-center px-6 rounded-xl border-4 border-black
                                     shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]
                                     transition-all duration-200
                                     group-hover:bg-yellow-50 group-hover:border-yellow-400
                                     group-hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.35)]
                                     group-hover:-translate-x-0.5 group-hover:-translate-y-0.5
                                     overflow-hidden relative`}
                >
                  {/* Pop art dot background */}
                  <div className="absolute inset-0 pop-art-dots opacity-10" />

                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-3 w-full min-w-0">
                    {value ? (
                      <>
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-pink-500 border-2 border-black flex items-center justify-center">
                          <IconMusic className="w-5 h-5 text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xl font-black text-black uppercase truncate">
                            {value.name}
                          </div>
                          <div className="text-xs text-gray-600 font-bold">
                            {(value.size / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-300 border-2 border-black border-dashed flex items-center justify-center">
                          <IconMusic className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xl font-black text-gray-500 uppercase">
                            Click to select MP3
                          </div>
                          <div className="text-xs text-gray-400 font-bold">
                            Max 20MB
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <FormMessage className="mt-2 text-red-600 font-bold" />
              </div>
            </FormItem>
          )}
        />
        <Button disabled={loading} variant={'pop'} type="submit" className="">
          {loading ? (
            <LoaderCircle className={'animate-spin h-5 w-5'} />
          ) : (
            'Submit'
          )}
        </Button>
      </form>
    </Form>
  )
}
