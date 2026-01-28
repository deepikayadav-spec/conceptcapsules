import { useState } from 'react';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThumbsUp, Star, Users, MessageSquare, Search, ArrowUpDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortField = 'likes' | 'avgRating' | 'feedbackCount' | 'byte_name';
type SortDirection = 'asc' | 'desc';

export default function Admin() {
  const { analytics, videoAnalytics, loading, error } = useAdminAnalytics();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('likes');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedVideos = videoAnalytics
    .filter(video => 
      video.byte_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.byte_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'likes':
          aVal = a.likes;
          bVal = b.likes;
          break;
        case 'avgRating':
          aVal = a.avgRating || 0;
          bVal = b.avgRating || 0;
          break;
        case 'feedbackCount':
          aVal = a.feedbackCount;
          bVal = b.feedbackCount;
          break;
        case 'byte_name':
          aVal = a.byte_name.toLowerCase();
          bVal = b.byte_name.toLowerCase();
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const exportToCSV = () => {
    const headers = ['Video Name', 'Description', 'Topics', 'Likes', 'Avg Rating', 'Feedback Count'];
    const rows = filteredAndSortedVideos.map(video => [
      `"${video.byte_name}"`,
      `"${video.byte_description.replace(/"/g, '""')}"`,
      `"${video.topics.join(', ')}"`,
      video.likes,
      video.avgRating?.toFixed(1) || 'N/A',
      video.feedbackCount
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `video-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  const videosWithNoEngagement = videoAnalytics.filter(v => v.likes === 0 && v.feedbackCount === 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Analytics</h1>
            <p className="text-muted-foreground mt-1">Video engagement and feedback overview</p>
          </div>
          <Button 
            variant="outline" 
            onClick={exportToCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalUniqueUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Based on browser fingerprints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalLikes || 0}</div>
              <p className="text-xs text-muted-foreground">Across all videos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalFeedback || 0}</div>
              <p className="text-xs text-muted-foreground">Ratings & comments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.overallAvgRating ? analytics.overallAvgRating.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Out of 5 stars</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedVideos.length} videos
          </div>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <CardTitle>Video Engagement</CardTitle>
            <CardDescription>Click column headers to sort</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('byte_name')}
                    >
                      <div className="flex items-center gap-1">
                        Video
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Topics</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground text-center"
                      onClick={() => handleSort('likes')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        Likes
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground text-center"
                      onClick={() => handleSort('avgRating')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3" />
                        Rating
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground text-center"
                      onClick={() => handleSort('feedbackCount')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Feedback
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedVideos.map((video) => (
                    <TableRow key={video.byte_id}>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="font-medium truncate">{video.byte_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{video.byte_description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {video.topics.slice(0, 2).map(topic => (
                            <Badge key={topic} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-medium",
                          video.likes > 0 ? "text-primary" : "text-muted-foreground"
                        )}>
                          {video.likes}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {video.avgRating ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{video.avgRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-medium",
                          video.feedbackCount > 0 ? "text-primary" : "text-muted-foreground"
                        )}>
                          {video.feedbackCount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Videos with No Engagement */}
        {videosWithNoEngagement.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Videos with No Engagement</CardTitle>
              <CardDescription>{videosWithNoEngagement.length} videos have received no likes or feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {videosWithNoEngagement.map(video => (
                  <div key={video.byte_id} className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium text-sm truncate">{video.byte_name}</p>
                    <div className="flex gap-1 mt-1">
                      {video.topics.slice(0, 2).map(topic => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Comments */}
        {videoAnalytics.some(v => v.comments.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Comments</CardTitle>
              <CardDescription>Latest feedback from users</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {videoAnalytics
                    .flatMap(video => 
                      video.comments
                        .filter(c => c.comment)
                        .map(c => ({ ...c, videoName: video.byte_name, byte_id: video.byte_id }))
                    )
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 20)
                    .map((comment, idx) => (
                      <div key={`${comment.byte_id}-${idx}`} className="p-4 rounded-lg bg-muted/30 border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{comment.videoName}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={cn(
                                  "h-3 w-3",
                                  i < comment.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                )} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
