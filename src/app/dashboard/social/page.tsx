'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { PLATFORM_SPECS, SOCIAL_PLATFORMS, type SocialPlatformId } from '@/lib/social/platforms'

type Account = { id: string; platform: SocialPlatformId; displayName: string; status: string }
type Target = {
  id: string
  accountId: string
  contentOverride: string | null
  status: string
  lastError: string | null
  externalUrl: string | null
  account: Account
}
type Post = {
  id: string
  title: string | null
  content: string
  linkUrl: string | null
  mediaUrls: string[]
  hashtags: string[]
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  reviewNote: string | null
  updatedAt: string
  createdById: string
  targets: Target[]
  createdBy: { name: string | null; email: string }
  approvedBy: { name: string | null; email: string } | null
  events?: { id: string; action: string; note: string | null; createdAt: string; user: { name: string | null; email: string } | null }[]
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  CHANGES_REQUESTED: 'bg-orange-100 text-orange-800',
  REJECTED: 'bg-red-100 text-red-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  PUBLISHING: 'bg-indigo-100 text-indigo-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  PARTIALLY_PUBLISHED: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
}

async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = Array.isArray(json.details) && json.details.length ? `: ${json.details.join('; ')}` : ''
    throw new Error((json.error || 'Request failed') + detail)
  }
  return json
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || ''}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function Composer({ accounts, post, isOwner, onClose, onSaved }: {
  accounts: Account[]
  post: Post | null
  isOwner: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [linkUrl, setLinkUrl] = useState(post?.linkUrl || '')
  const [mediaText, setMediaText] = useState((post?.mediaUrls || []).join('\n'))
  const [hashtags, setHashtags] = useState((post?.hashtags || []).join(', '))
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(post?.scheduledAt || null))
  const [selected, setSelected] = useState<Record<string, string>>(
    Object.fromEntries((post?.targets || []).map((t) => [t.accountId, t.contentOverride || ''])),
  )
  const [topic, setTopic] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [busy, setBusy] = useState(false)

  const selectedAccounts = accounts.filter((a) => a.id in selected)

  const generate = async () => {
    if (topic.trim().length < 3) return toast({ title: 'Describe the topic first', variant: 'destructive' })
    const platforms = Array.from(new Set(selectedAccounts.map((a) => a.platform)))
    setAiBusy(true)
    try {
      const { data } = await api('/api/social/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          sourceText: content || undefined,
          platforms: platforms.length ? platforms : ['LINKEDIN'],
        }),
      })
      setContent(data.content)
      if (data.hashtags?.length) setHashtags(data.hashtags.join(', '))
      setSelected((prev) => {
        const next = { ...prev }
        for (const a of selectedAccounts) next[a.id] = data.variants?.[a.platform] || ''
        return next
      })
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    } finally {
      setAiBusy(false)
    }
  }

  const save = async (mode: 'draft' | 'submit' | 'publish') => {
    setBusy(true)
    try {
      const body = {
        title: title || null,
        content,
        linkUrl: linkUrl || null,
        mediaUrls: mediaText.split('\n').map((s) => s.trim()).filter(Boolean),
        hashtags: hashtags.split(',').map((s) => s.trim().replace(/^#/, '')).filter(Boolean),
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        targets: Object.entries(selected).map(([accountId, o]) => ({ accountId, contentOverride: o || null })),
      }
      const saved = post
        ? await api(`/api/social/posts/${post.id}`, { method: 'PUT', body: JSON.stringify(body) })
        : await api('/api/social/posts', { method: 'POST', body: JSON.stringify(body) })
      const id = saved.data.id
      if (mode !== 'draft') {
        await api(`/api/social/posts/${id}/action`, { method: 'POST', body: JSON.stringify({ action: 'submit' }) })
      }
      if (mode === 'publish') {
        await api(`/api/social/posts/${id}/action`, { method: 'POST', body: JSON.stringify({ action: 'approve' }) })
      }
      toast({
        title: mode === 'draft' ? 'Draft saved' : mode === 'submit' ? 'Submitted for approval' : 'Approved',
      })
      onSaved()
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={post ? 'Edit post' : 'New post'} onClose={onClose}>
      <div className="space-y-4">
        {post && ['PENDING_APPROVAL', 'SCHEDULED'].includes(post.status) && (
          <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">
            Saving changes will void the current approval and return the post to draft.
          </p>
        )}
        {post?.reviewNote && (
          <p className="rounded bg-orange-50 p-2 text-sm text-orange-800">Reviewer comment: {post.reviewNote}</p>
        )}

        <div className="rounded border border-purple-200 bg-purple-50 p-3">
          <div className="flex gap-2">
            <Input placeholder="AI: what should this post be about?" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <Button type="button" variant="outline" onClick={generate} disabled={aiBusy}>
              {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
              Generate
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Select accounts first to get a variant per platform. Text already in the box is used as source material.</p>
        </div>

        <Input placeholder="Internal title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className="min-h-[140px] w-full rounded-md border p-2 text-sm"
          placeholder="Post content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Link URL (optional)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          <Input placeholder="Hashtags, comma separated" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
        </div>
        <textarea
          className="min-h-[60px] w-full rounded-md border p-2 text-sm"
          placeholder="Media URLs (public https links, one per line)"
          value={mediaText}
          onChange={(e) => setMediaText(e.target.value)}
        />

        <div>
          <p className="mb-2 text-sm font-medium">Publish to</p>
          {accounts.length === 0 && <p className="text-sm text-gray-500">No connected accounts. Add one in the Accounts tab.</p>}
          <div className="space-y-2">
            {accounts.map((a) => {
              const checked = a.id in selected
              const limit = PLATFORM_SPECS[a.platform].maxChars
              const text = selected[a.id] || content
              return (
                <div key={a.id} className="rounded border p-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={a.status !== 'CONNECTED'}
                      onChange={(e) =>
                        setSelected((prev) => {
                          const next = { ...prev }
                          if (e.target.checked) next[a.id] = ''
                          else delete next[a.id]
                          return next
                        })
                      }
                    />
                    <span className="font-medium">{PLATFORM_SPECS[a.platform].label}</span>
                    <span className="text-gray-500">{a.displayName}</span>
                    {a.status !== 'CONNECTED' && <span className="text-xs text-red-600">({a.status})</span>}
                    {checked && (
                      <span className={`ml-auto text-xs ${text.length > limit ? 'text-red-600' : 'text-gray-500'}`}>
                        {text.length}/{limit}
                      </span>
                    )}
                  </label>
                  {checked && (
                    <textarea
                      className="mt-2 w-full rounded-md border p-2 text-sm"
                      rows={2}
                      placeholder="Platform-specific version (leave empty to use the main content)"
                      value={selected[a.id]}
                      onChange={(e) => setSelected((prev) => ({ ...prev, [a.id]: e.target.value }))}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Schedule (optional, leave empty to publish right after approval)</label>
          <input
            type="datetime-local"
            className="rounded-md border p-2 text-sm"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => save('draft')} disabled={busy || !content.trim()}>Save draft</Button>
          <Button variant={isOwner ? 'outline' : 'default'} onClick={() => save('submit')} disabled={busy || !content.trim()}>
            Submit for approval
          </Button>
          {isOwner && (
            <Button onClick={() => save('publish')} disabled={busy || !content.trim()}>
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Approve &amp; publish
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function PostDetail({ id, isOwner, userId, onClose, onChanged, onEdit }: {
  id: string
  isOwner: boolean
  userId: string
  onClose: () => void
  onChanged: () => void
  onEdit: (p: Post) => void
}) {
  const { toast } = useToast()
  const [note, setNote] = useState('')
  const { data, refetch, isLoading } = useQuery({
    queryKey: ['social-post', id],
    queryFn: () => api<{ data: Post }>(`/api/social/posts/${id}`),
  })
  const post = data?.data

  const run = async (action: string, requireNote = false) => {
    if (requireNote && !note.trim()) return toast({ title: 'Please add a comment', variant: 'destructive' })
    try {
      await api(`/api/social/posts/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, note: note || undefined, expectedUpdatedAt: post?.updatedAt }),
      })
      setNote('')
      await refetch()
      onChanged()
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
      refetch()
    }
  }

  const remove = async () => {
    if (!confirm('Delete this post?')) return
    try {
      await api(`/api/social/posts/${id}`, { method: 'DELETE' })
      onChanged()
      onClose()
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    }
  }

  return (
    <Modal title="Post details" onClose={onClose}>
      {isLoading || !post ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      ) : (
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <StatusBadge status={post.status} />
            <span className="text-gray-500">by {post.createdBy.name || post.createdBy.email}</span>
            {post.scheduledAt && <span className="text-gray-500">· {new Date(post.scheduledAt).toLocaleString()}</span>}
          </div>
          {post.title && <p className="font-semibold">{post.title}</p>}
          <p className="whitespace-pre-wrap rounded bg-gray-50 p-3">{post.content}</p>
          {post.linkUrl && <p className="text-blue-600 break-all">{post.linkUrl}</p>}
          {post.hashtags.length > 0 && <p className="text-gray-600">{post.hashtags.map((h) => `#${h}`).join(' ')}</p>}
          {post.reviewNote && <p className="rounded bg-orange-50 p-2 text-orange-800">Reviewer: {post.reviewNote}</p>}

          <div className="space-y-2">
            {post.targets.map((t) => (
              <div key={t.id} className="rounded border p-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{PLATFORM_SPECS[t.account.platform].label}</span>
                  <span className="text-gray-500">{t.account.displayName}</span>
                  <StatusBadge status={t.status} />
                  {t.externalUrl && <a className="ml-auto text-blue-600 underline" href={t.externalUrl} target="_blank" rel="noreferrer">View</a>}
                </div>
                {t.contentOverride && <p className="mt-1 whitespace-pre-wrap text-gray-600">{t.contentOverride}</p>}
                {t.lastError && <p className="mt-1 text-red-600">{t.lastError}</p>}
              </div>
            ))}
          </div>

          {(isOwner && post.status === 'PENDING_APPROVAL') && (
            <div className="space-y-2 rounded border border-amber-200 bg-amber-50 p-3">
              <textarea
                className="w-full rounded-md border p-2"
                rows={2}
                placeholder="Comment (required to reject or request changes)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => run('approve')}>Approve &amp; publish</Button>
                <Button variant="outline" onClick={() => run('request_changes', true)}>Request changes</Button>
                <Button variant="outline" onClick={() => run('reject', true)}>Reject</Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(post.status) && (
              <Button onClick={() => run('submit')}>Submit for approval</Button>
            )}
            {['SCHEDULED', 'PENDING_APPROVAL'].includes(post.status) && (
              <Button variant="outline" onClick={() => run('unschedule')}>Unschedule</Button>
            )}
            {isOwner && ['FAILED', 'PARTIALLY_PUBLISHED'].includes(post.status) && (
              <Button onClick={() => run('retry')}>Retry failed</Button>
            )}
            {!['PUBLISHING', 'PUBLISHED', 'PARTIALLY_PUBLISHED'].includes(post.status) &&
              (isOwner || post.createdById === userId) && (
                <>
                  <Button variant="outline" onClick={() => onEdit(post)}>Edit</Button>
                  <Button variant="outline" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
                </>
              )}
          </div>

          <div>
            <p className="mb-1 font-medium">Audit trail</p>
            <ul className="space-y-1 text-xs text-gray-600">
              {(post.events || []).map((e) => (
                <li key={e.id}>
                  {new Date(e.createdAt).toLocaleString()} · <b>{e.action}</b> · {e.user?.name || e.user?.email || 'system'}
                  {e.note ? ` — ${e.note}` : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  )
}

function CalendarView({ posts, onOpen }: { posts: Post[]; onOpen: (id: string) => void }) {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const days = useMemo(() => {
    const first = new Date(month)
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return { offset: first.getDay(), count }
  }, [month])

  const byDay = (day: number) =>
    posts.filter((p) => {
      const d = p.scheduledAt || p.publishedAt
      if (!d) return false
      const dt = new Date(d)
      return dt.getFullYear() === month.getFullYear() && dt.getMonth() === month.getMonth() && dt.getDate() === day
    })

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>Prev</Button>
        <span className="font-medium">{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
        <Button variant="outline" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Next</Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="p-1 text-center font-medium text-gray-500">{d}</div>
        ))}
        {Array.from({ length: days.offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days.count }).map((_, i) => (
          <div key={i} className="min-h-[80px] rounded border p-1">
            <div className="text-gray-400">{i + 1}</div>
            {byDay(i + 1).map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(p.id)}
                className={`mt-1 block w-full truncate rounded px-1 text-left ${STATUS_STYLES[p.status] || ''}`}
              >
                {p.title || p.content}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function AccountsTab({ accounts, canManage, onChanged }: { accounts: Account[]; canManage: boolean; onChanged: () => void }) {
  const { toast } = useToast()
  const [platform, setPlatform] = useState<SocialPlatformId>('LINKEDIN')
  const [displayName, setDisplayName] = useState('')
  const [externalId, setExternalId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [meta, setMeta] = useState<Record<string, string>>({})
  const spec = PLATFORM_SPECS[platform]

  const connect = async () => {
    try {
      await api('/api/social/accounts', {
        method: 'POST',
        body: JSON.stringify({ platform, displayName, externalId, accessToken, metadata: meta }),
      })
      setDisplayName(''); setExternalId(''); setAccessToken(''); setMeta({})
      toast({ title: 'Account connected' })
      onChanged()
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    }
  }

  const disconnect = async (id: string) => {
    if (!confirm('Disconnect this account?')) return
    try {
      await api(`/api/social/accounts?id=${id}`, { method: 'DELETE' })
      onChanged()
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {accounts.length === 0 && <p className="text-sm text-gray-500">No accounts connected yet.</p>}
        {accounts.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center gap-3 p-3 text-sm">
              <span className="font-medium">{PLATFORM_SPECS[a.platform].label}</span>
              <span className="text-gray-500">{a.displayName}</span>
              <span className={a.status === 'CONNECTED' ? 'text-green-600' : 'text-red-600'}>{a.status}</span>
              {canManage && (
                <Button className="ml-auto" variant="outline" size="sm" onClick={() => disconnect(a.id)}>Disconnect</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {canManage ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="font-medium">Connect an account</p>
            <select
              className="w-full rounded-md border p-2 text-sm"
              value={platform}
              onChange={(e) => { setPlatform(e.target.value as SocialPlatformId); setMeta({}) }}
            >
              {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_SPECS[p].label}</option>)}
            </select>
            {spec.unsupportedReason && <p className="text-sm text-amber-700">{spec.unsupportedReason}</p>}
            <Input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <Input placeholder={`${spec.externalIdLabel} — ${spec.externalIdHint}`} value={externalId} onChange={(e) => setExternalId(e.target.value)} />
            <Input type="password" placeholder="Access token" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
            {(spec.extraFields || []).map((f) => (
              <Input
                key={f.key}
                placeholder={`${f.label}${f.required ? ' *' : ''} — ${f.hint}`}
                value={meta[f.key] || ''}
                onChange={(e) => setMeta((m) => ({ ...m, [f.key]: e.target.value }))}
              />
            ))}
            <p className="text-xs text-gray-500">Tokens are encrypted at rest and never shown again.</p>
            <Button onClick={connect} disabled={!displayName || !externalId || !accessToken}>Connect</Button>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-gray-500">Only owners and admins can connect accounts.</p>
      )}
    </div>
  )
}

export default function SocialPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const user = session?.user as any
  const isOwner = user?.role === 'OWNER'
  const canManage = isOwner || user?.role === 'ADMIN'
  const canCompose = !!user && user.role !== 'VIEWER'

  const [tab, setTab] = useState<'posts' | 'approvals' | 'calendar' | 'accounts'>('posts')
  const [statusFilter, setStatusFilter] = useState('')
  const [composer, setComposer] = useState<{ post: Post | null } | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const postsQuery = useQuery({
    queryKey: ['social-posts'],
    queryFn: () => api<{ data: Post[] }>('/api/social/posts'),
    refetchInterval: 30000,
  })
  const accountsQuery = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => api<{ data: Account[] }>('/api/social/accounts'),
  })
  const posts = postsQuery.data?.data || []
  const accounts = accountsQuery.data?.data || []
  const pending = posts.filter((p) => p.status === 'PENDING_APPROVAL')

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['social-posts'] })
    queryClient.invalidateQueries({ queryKey: ['social-post'] })
  }

  const visible = statusFilter ? posts.filter((p) => p.status === statusFilter) : posts
  const tabs = [
    ['posts', 'Posts'],
    ['approvals', `Approvals${pending.length ? ` (${pending.length})` : ''}`],
    ['calendar', 'Calendar'],
    ['accounts', 'Accounts'],
  ] as const

  const PostRow = ({ p }: { p: Post }) => (
    <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setDetailId(p.id)}>
      <CardContent className="flex items-center gap-3 p-3 text-sm">
        <StatusBadge status={p.status} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{p.title || p.content}</p>
          <p className="truncate text-xs text-gray-500">
            {p.targets.map((t) => PLATFORM_SPECS[t.account.platform].label).join(', ') || 'No accounts'} · {p.createdBy.name || p.createdBy.email}
          </p>
        </div>
        {p.scheduledAt && <span className="text-xs text-gray-500">{new Date(p.scheduledAt).toLocaleString()}</span>}
      </CardContent>
    </Card>
  )

  return (
    <div>
      <Header
        title="Social Publishing"
        description="Create posts, get owner approval, then publish to your channels"
        action={
          canCompose ? (
            <Button onClick={() => setComposer({ post: null })}>
              <Plus className="mr-1 h-4 w-4" />New post
            </Button>
          ) : undefined
        }
      />
      <div className="space-y-4 p-6">
        <div className="flex gap-2 border-b">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-2 text-sm ${tab === key ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {postsQuery.isLoading && <Loader2 className="h-6 w-6 animate-spin" />}

        {tab === 'posts' && (
          <div className="space-y-2">
            <select className="rounded-md border p-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {Object.keys(STATUS_STYLES).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            {visible.length === 0 && !postsQuery.isLoading && <p className="text-sm text-gray-500">No posts yet.</p>}
            {visible.map((p) => <PostRow key={p.id} p={p} />)}
          </div>
        )}

        {tab === 'approvals' && (
          <div className="space-y-2">
            {!isOwner && <p className="text-sm text-gray-500">Only the owner can approve posts. Posts you submit appear here while pending.</p>}
            {pending.length === 0 && <p className="text-sm text-gray-500">Nothing waiting for approval.</p>}
            {pending.map((p) => <PostRow key={p.id} p={p} />)}
          </div>
        )}

        {tab === 'calendar' && <CalendarView posts={posts} onOpen={setDetailId} />}

        {tab === 'accounts' && (
          <AccountsTab
            accounts={accounts}
            canManage={canManage}
            onChanged={() => queryClient.invalidateQueries({ queryKey: ['social-accounts'] })}
          />
        )}
      </div>

      {composer && (
        <Composer
          accounts={accounts}
          post={composer.post}
          isOwner={isOwner}
          onClose={() => setComposer(null)}
          onSaved={() => { setComposer(null); refresh() }}
        />
      )}
      {detailId && !composer && (
        <PostDetail
          id={detailId}
          isOwner={isOwner}
          userId={user?.id}
          onClose={() => setDetailId(null)}
          onChanged={refresh}
          onEdit={(p) => { setDetailId(null); setComposer({ post: p }) }}
        />
      )}
    </div>
  )
}
