import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  ExternalLink, 
  MapPin, 
  Award,
  ChevronRight,
  Star,
  Linkedin,
  FileText,
  Eye
} from 'lucide-react'

export const metadata = {
  title: 'Career Services',
}

export default async function CareerServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      user_xp (total_xp, rank),
      certificates (id, certificate_id, course_id, created_at, metadata)
    `)
    .eq('id', user.id)
    .single()

  const { data: badges } = await supabase
    .from('user_badges')
    .select('badge:badges(*)')
    .eq('user_id', user.id)

  const hasProfile = profile?.full_name && profile?.bio

  const jobBoards = [
    { name: 'UX Design Jobs', url: 'https://uxdesign.cc', jobs: 500 },
    { name: 'Dribbble Jobs', url: 'https://dribbble.com/jobs', jobs: 200 },
    { name: 'We Work Remotely', url: 'https://weworkremotely.com', jobs: 150 },
    { name: 'Remote OK', url: 'https://remoteok.com', jobs: 300 },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Career Services</h1>
        <p className="text-muted-foreground mt-1">Build your portfolio, find opportunities, and land your dream design role.</p>
      </div>

      {/* Profile Completion Alert */}
      {!hasProfile && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-medium">Complete your profile</p>
                <p className="text-sm text-muted-foreground">Add your bio and avatar to make your portfolio visible to employers.</p>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm">Complete Profile</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{profile?.user_xp?.[0]?.total_xp || 0}</p>
            <p className="text-sm text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold capitalize">{profile?.user_xp?.[0]?.rank || 'beginner'}</p>
            <p className="text-sm text-muted-foreground">Current Rank</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{profile?.certificates?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Certificates</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{badges?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Badges</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Portfolio Section */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Your Portfolio
            </CardTitle>
            <CardDescription>Showcase your skills to potential employers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.certificates?.length ? (
              <div className="space-y-3">
                {profile.certificates.map((cert: any) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Course Completed</p>
                        <p className="text-xs text-muted-foreground">ID: {cert.certificate_id}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Complete courses to build your portfolio</p>
              </div>
            )}

            {badges && badges.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Earned Badges</p>
                <div className="flex flex-wrap gap-2">
                  {badges.slice(0, 6).map((item: any) => (
                    <Badge key={item.badge?.id} variant="outline" className="gap-1">
                      {(item.badge as any)?.rarity === 'legendary' && '🌟'}
                      {(item.badge as any)?.rarity === 'epic' && '💜'}
                      {(item.badge as any)?.rarity === 'rare' && '💙'}
                      {item.badge?.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Link href={`/profile/${user.id}`} className="block pt-4">
              <Button className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                View Public Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Job Resources */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Job Boards
            </CardTitle>
            <CardDescription>Curated design job opportunities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobBoards.map((board) => (
              <a
                key={board.name}
                href={board.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{board.name}</p>
                    <p className="text-xs text-muted-foreground">{board.jobs}+ open positions</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* LinkedIn Optimization */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5" />
            LinkedIn Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Profile Essentials</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" />
                  Add "Product Design Student" or "UX Learner" to your headline
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" />
                  List Academy as a certification with your certificate IDs
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" />
                  Showcase your badges in the "Skills" section
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" />
                  Write about your learning journey in posts
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Sample Headlines</h4>
              <div className="space-y-2 text-sm">
                <p className="p-3 bg-muted/50 rounded-lg italic">
                  "Aspiring UX Designer | Learning Product Design at Academy | {profile?.user_xp?.[0]?.rank || 'Beginner'} Level"
                </p>
                <p className="p-3 bg-muted/50 rounded-lg italic">
                  "{profile?.certificates?.length || 0} Design Certifications | Building my portfolio at Academy"
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Tips */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Builder
          </CardTitle>
          <CardDescription>Highlight your Academy achievements.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use these bullet points in your resume to highlight your Academy achievements:
            </p>
            <div className="grid gap-3">
              {[
                `Completed ${profile?.certificates?.length || 0} design courses with practical projects`,
                `Earned ${profile?.user_xp?.[0]?.total_xp || 0} XP through hands-on design challenges`,
                `Achieved ${profile?.user_xp?.[0]?.rank || 'beginner'} rank in product design competencies`,
                `Built portfolio-ready case studies through project submissions`,
                `${badges?.length || 0} professional badges earned in design skills`,
              ].map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-sm">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
