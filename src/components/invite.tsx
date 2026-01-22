'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Send, MailPlus } from 'lucide-react'
import { toast } from 'sonner' // 假设你使用了 sonner

interface InviteProps {
  songId: string
  difficulty: string
  songName?: string // 可选，用于显示
}

export function Invite({ songId, difficulty, songName }: InviteProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!difficulty) {
      toast.error('Please enter difficulty.')
      return
    }
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    setIsSending(true)

    try {
      // 调用创建房间/发送邀请的 API
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId,
          difficulty,
          inviteeEmail: email
        })
      })

      if (!res.ok) {
        throw new Error('Failed to send invitation')
      }

      toast.success(`Invitation sent to ${email}!`)
      setOpen(false) // 关闭弹窗
      setEmail('') // 清空输入框
    } catch (error) {
      toast.error('Could not send invitation. Check if user exists.')
      console.error(error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="pop" className="gap-2">
          <MailPlus className="w-4 h-4" />
          Invite
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send Duel Invitation</DialogTitle>
            <DialogDescription>
              Challenge a friend to <b>{songName || 'this song'}</b> (
              {difficulty}). They will receive a notification instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="email">Friend&#39;s Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="player@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
