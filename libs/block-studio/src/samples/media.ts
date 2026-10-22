/**
 * Sample payloads for the media blocks.
 *
 * Each entry is a named, ready-made treatment of one block type. They are
 * deliberately realistic: a chart that says "cases" and "year" tells an
 * editor far more about how the block reads in a story than
 * "Category 1 / 42" does.
 *
 * Every variant is validated against its block's schema by
 * `tests/unit/blocks/block-studio-samples.test.ts`, so a sample can never
 * drift away from the block it demonstrates.
 */
import type { StudioVariant } from '../types';
import { image } from './assets';

export const MEDIA_SAMPLES: Record<string, StudioVariant[]> = {
  image: [
    {
      id: 'plain',
      label: 'Plain',
      description: 'The picture on its own, with a caption beneath.',
      data: {
        layout: 'plain',
        url: image('solar-array-1'),
        altText: 'Rows of solar panels stretching to the horizon under a low sun',
        caption: 'The Northfield array at first light, six months after commissioning.',
        aspectRatio: '16:9',
        credit: 'Nia Bergman / GlobalPulse',
        sourceAttribution: 'Northfield Energy',
      },
    },
    {
      id: 'framed',
      label: 'Framed',
      description: 'The picture in a frame, set off from the page.',
      data: {
        layout: 'framed',
        url: image('solar-array-1'),
        altText: 'Rows of solar panels stretching to the horizon under a low sun',
        caption: 'The Northfield array at first light, six months after commissioning.',
        aspectRatio: '16:9',
        credit: 'Nia Bergman / GlobalPulse',
        sourceAttribution: 'Northfield Energy',
      },
    },
    {
      id: 'full-bleed',
      label: 'Full bleed',
      description: 'The picture edge to edge, breaking out of the column.',
      data: {
        layout: 'full-bleed',
        url: image('solar-array-1'),
        altText: 'Rows of solar panels stretching to the horizon under a low sun',
        caption: 'The Northfield array at first light, six months after commissioning.',
        aspectRatio: '16:9',
        credit: 'Nia Bergman / GlobalPulse',
        sourceAttribution: 'Northfield Energy',
      },
    },
  ],

  gallery: [
    {
      id: 'grid',
      label: 'Grid',
      description: 'A two-column grid of images.',
      data: {
        title: 'Inside the Northfield substation',
        layout: 'grid',
        images: [
          {
            url: image('substation-a'),
            altText: 'Transformers and busbars in a substation yard',
            caption: 'The 400 kV yard, seen from the gantry.',
            credit: 'Field Desk',
          },
          {
            url: image('substation-b'),
            altText: 'A control room bank of relay panels',
            caption: 'Protection relays are mirrored to the regional control centre.',
            credit: 'Field Desk',
          },
          {
            url: image('substation-c'),
            altText: 'A high-voltage line disappearing into haze',
            caption: 'The eastern spur, photographed at dawn.',
            credit: 'Field Desk',
          },
          {
            url: image('substation-d'),
            altText: 'Technicians inspecting a transformer bushing',
            caption: 'A routine inspection ahead of the winter peak.',
            credit: 'Field Desk',
          },
        ],
      },
    },
    {
      id: 'carousel',
      label: 'Carousel',
      description: 'A swipeable sequence.',
      data: {
        title: 'A year in the life of the grid',
        layout: 'carousel',
        images: [
          {
            url: image('carousel-spring'),
            altText: 'Blossoming branches against a pylon',
            caption: 'March: the first maintenance window of the year.',
          },
          {
            url: image('carousel-summer'),
            altText: 'A heat haze over a substation',
            caption: 'July: the peak demand test.',
          },
          {
            url: image('carousel-autumn'),
            altText: 'Mist over a line corridor',
            caption: 'October: the storm season begins.',
          },
        ],
      },
    },
    {
      id: 'masonry',
      label: 'Masonry',
      description: 'A mixed-height mosaic.',
      data: {
        title: 'Field photographs',
        layout: 'masonry',
        images: [
          {
            url: image('masonry-a', 800, 1000),
            altText: 'A lineman climbing a pylon',
            caption: 'Climbing the eastern spur.',
          },
          {
            url: image('masonry-b', 800, 600),
            altText: 'A control room at night',
            caption: 'Night shift, regional control.',
          },
          {
            url: image('masonry-c', 800, 800),
            altText: 'Snow on a steel lattice tower',
            caption: 'The line, in February.',
          },
        ],
      },
    },
    {
      id: 'untitled-grid',
      label: 'Untitled grid',
      description: 'A grid with no heading above it, and credits on every picture.',
      data: {
        layout: 'grid',
        images: [
          {
            url: image('six-a'),
            altText: 'A line crew arriving at a substation gate',
            caption: 'Week one: the crew arrives.',
            credit: 'Field Desk',
          },
          {
            url: image('six-b'),
            altText: 'A technician testing a bushing with a meter',
            caption: 'Week two: the first readings.',
            credit: 'Field Desk',
          },
          {
            url: image('six-c'),
            altText: 'A crane lifting a transformer into position',
            caption: 'Week three: the replacement unit.',
            credit: 'Field Desk',
          },
        ],
      },
    },
  ],

  annotated_image: [
    {
      id: 'markers',
      label: 'Markers',
      description: 'Dots on the picture that open when they are clicked.',
      data: {
        layout: 'markers',
        url: image('delta-satellite'),
        altText: 'Satellite view of a river delta with a breached embankment',
        caption: 'The breach at kilometre 42 sits where the old channel was.',
        credit: 'Planet / GlobalPulse',
        annotations: [
          {
            id: 'a1',
            xPercent: 41,
            yPercent: 52,
            label: 'Embankment breach',
            description: 'Observed breach point, confirmed on two passes.',
          },
          {
            id: 'a2',
            xPercent: 63,
            yPercent: 38,
            label: 'Flood extent',
            description: 'The waterline against the secondary road.',
          },
          {
            id: 'a3',
            xPercent: 22,
            yPercent: 71,
            label: 'Levee reinforcement',
            description: 'Emergency fill placed over eight days.',
          },
        ],
      },
    },
    {
      id: 'numbered',
      label: 'Numbered',
      description: 'Numbered markers, in the order the list gives them.',
      data: {
        layout: 'numbered',
        url: image('delta-satellite'),
        altText: 'Satellite view of a river delta with a breached embankment',
        caption: 'The breach at kilometre 42 sits where the old channel was.',
        credit: 'Planet / GlobalPulse',
        annotations: [
          {
            id: 'a1',
            xPercent: 41,
            yPercent: 52,
            label: 'Embankment breach',
            description: 'Observed breach point, confirmed on two passes.',
          },
          {
            id: 'a2',
            xPercent: 63,
            yPercent: 38,
            label: 'Flood extent',
            description: 'The waterline against the secondary road.',
          },
          {
            id: 'a3',
            xPercent: 22,
            yPercent: 71,
            label: 'Levee reinforcement',
            description: 'Emergency fill placed over eight days.',
          },
        ],
      },
    },
    {
      id: 'callouts',
      label: 'Callouts',
      description: 'Every annotation shown at once, with nothing left to click.',
      data: {
        layout: 'callouts',
        url: image('delta-satellite'),
        altText: 'Satellite view of a river delta with a breached embankment',
        caption: 'The breach at kilometre 42 sits where the old channel was.',
        credit: 'Planet / GlobalPulse',
        annotations: [
          {
            id: 'a1',
            xPercent: 41,
            yPercent: 52,
            label: 'Embankment breach',
            description: 'Observed breach point, confirmed on two passes.',
          },
          {
            id: 'a2',
            xPercent: 63,
            yPercent: 38,
            label: 'Flood extent',
            description: 'The waterline against the secondary road.',
          },
          {
            id: 'a3',
            xPercent: 22,
            yPercent: 71,
            label: 'Levee reinforcement',
            description: 'Emergency fill placed over eight days.',
          },
        ],
      },
    },
  ],

  image_diff: [
    {
      id: 'slider',
      label: 'Slider',
      description: 'One picture over the other, with a draggable split.',
      data: {
        layout: 'slider',
        beforeUrl: image('before-harbour'),
        afterUrl: image('after-harbour'),
        beforeLabel: 'June 2024',
        afterLabel: 'June 2026',
        caption: 'The same stretch of shoreline, two years apart.',
        orientation: 'horizontal',
        defaultSplitPercent: 50,
        credit: 'GlobalPulse archive',
      },
    },
    {
      id: 'side-by-side',
      label: 'Side by side',
      description: 'The two pictures next to each other.',
      data: {
        layout: 'side-by-side',
        beforeUrl: image('before-harbour'),
        afterUrl: image('after-harbour'),
        beforeLabel: 'June 2024',
        afterLabel: 'June 2026',
        caption: 'The same stretch of shoreline, two years apart.',
        orientation: 'horizontal',
        defaultSplitPercent: 50,
        credit: 'GlobalPulse archive',
      },
    },
    {
      id: 'stacked',
      label: 'Stacked',
      description: 'The two pictures, one above the other.',
      data: {
        layout: 'stacked',
        beforeUrl: image('before-harbour'),
        afterUrl: image('after-harbour'),
        beforeLabel: 'June 2024',
        afterLabel: 'June 2026',
        caption: 'The same stretch of shoreline, two years apart.',
        orientation: 'horizontal',
        defaultSplitPercent: 50,
        credit: 'GlobalPulse archive',
      },
    },
  ],

  video: [
    {
      id: 'player',
      label: 'Player',
      description: 'The video in a card, with its chapters and transcript beneath.',
      data: {
        layout: 'player',
        url: '/videos/sample-video.mp4',
        posterUrl: image('video-poster'),
        aspectRatio: '16:9',
        caption: 'A two-minute summary of the review findings.',
        durationSeconds: 15,
        transcription:
          'The review found the reporting failures were systemic rather than isolated. Three of the four sites had no independent verification step at all.',
        chapters: [
          { startSeconds: 0, title: 'Introduction', description: 'What the review covered.' },
          { startSeconds: 5, title: 'The findings', description: 'What went wrong.' },
          { startSeconds: 11, title: 'What changes', description: 'The recommendations.' },
        ],
        transcriptSegments: [
          {
            startSeconds: 0,
            speaker: 'Narrator',
            text: 'The review looked at four reporting sites.',
          },
          { startSeconds: 5, speaker: 'Narrator', text: 'Three of them had no verification step.' },
          {
            startSeconds: 11,
            speaker: 'Narrator',
            text: 'The report recommends a mandatory second sign-off.',
          },
        ],
      },
    },
    {
      id: 'cinematic',
      label: 'Cinematic',
      description: 'The video full bleed, with nothing else around it.',
      data: {
        layout: 'cinematic',
        url: '/videos/sample-video.mp4',
        posterUrl: image('video-poster'),
        aspectRatio: '16:9',
        caption: 'A two-minute summary of the review findings.',
        durationSeconds: 15,
        transcription:
          'The review found the reporting failures were systemic rather than isolated. Three of the four sites had no independent verification step at all.',
        chapters: [
          { startSeconds: 0, title: 'Introduction', description: 'What the review covered.' },
          { startSeconds: 5, title: 'The findings', description: 'What went wrong.' },
          { startSeconds: 11, title: 'What changes', description: 'The recommendations.' },
        ],
        transcriptSegments: [
          {
            startSeconds: 0,
            speaker: 'Narrator',
            text: 'The review looked at four reporting sites.',
          },
          { startSeconds: 5, speaker: 'Narrator', text: 'Three of them had no verification step.' },
          {
            startSeconds: 11,
            speaker: 'Narrator',
            text: 'The report recommends a mandatory second sign-off.',
          },
        ],
      },
    },
    {
      id: 'inline',
      label: 'Inline',
      description: 'A small player beside the text, for a mention in the story.',
      data: {
        layout: 'inline',
        url: '/videos/sample-video.mp4',
        posterUrl: image('video-poster'),
        aspectRatio: '16:9',
        caption: 'A two-minute summary of the review findings.',
        durationSeconds: 15,
        transcription:
          'The review found the reporting failures were systemic rather than isolated. Three of the four sites had no independent verification step at all.',
        chapters: [
          { startSeconds: 0, title: 'Introduction', description: 'What the review covered.' },
          { startSeconds: 5, title: 'The findings', description: 'What went wrong.' },
          { startSeconds: 11, title: 'What changes', description: 'The recommendations.' },
        ],
        transcriptSegments: [
          {
            startSeconds: 0,
            speaker: 'Narrator',
            text: 'The review looked at four reporting sites.',
          },
          { startSeconds: 5, speaker: 'Narrator', text: 'Three of them had no verification step.' },
          {
            startSeconds: 11,
            speaker: 'Narrator',
            text: 'The report recommends a mandatory second sign-off.',
          },
        ],
      },
    },
  ],

  audio: [
    {
      id: 'player',
      label: 'Player',
      description: 'The recording in a card, with its chapters and speakers beneath.',
      data: {
        layout: 'player',
        url: '/audio/sample-briefing.mp3',
        title: 'The briefing: what the review found',
        narrator: 'Nia Bergman',
        durationSeconds: 30,
        language: 'en',
        transcript:
          'A full recording of the morning briefing, with the numbers from the review read out in sequence.',
        chapters: [
          { startSeconds: 0, title: 'The headline' },
          { startSeconds: 10, title: 'The numbers' },
          { startSeconds: 20, title: 'What happens next' },
        ],
        cuePoints: [
          { timeMs: 4000, text: 'Where the reporting gaps began' },
          { timeMs: 15000, text: 'The three affected sites', blockRefId: 'blk_table_1' },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Correspondent' },
          { id: 'sp2', name: 'Ravi Menon', role: 'Data editor' },
        ],
      },
    },
    {
      id: 'inline',
      label: 'Inline',
      description: 'A compact player for a mention in the middle of the story.',
      data: {
        layout: 'inline',
        url: '/audio/sample-briefing.mp3',
        title: 'The briefing: what the review found',
        narrator: 'Nia Bergman',
        durationSeconds: 30,
        language: 'en',
        transcript:
          'A full recording of the morning briefing, with the numbers from the review read out in sequence.',
        chapters: [
          { startSeconds: 0, title: 'The headline' },
          { startSeconds: 10, title: 'The numbers' },
          { startSeconds: 20, title: 'What happens next' },
        ],
        cuePoints: [
          { timeMs: 4000, text: 'Where the reporting gaps began' },
          { timeMs: 15000, text: 'The three affected sites', blockRefId: 'blk_table_1' },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Correspondent' },
          { id: 'sp2', name: 'Ravi Menon', role: 'Data editor' },
        ],
      },
    },
    {
      id: 'transcript-first',
      label: 'Transcript first',
      description: 'The recording with its transcript already open.',
      data: {
        layout: 'transcript-first',
        url: '/audio/sample-briefing.mp3',
        title: 'The briefing: what the review found',
        narrator: 'Nia Bergman',
        durationSeconds: 30,
        language: 'en',
        transcript:
          'A full recording of the morning briefing, with the numbers from the review read out in sequence.',
        chapters: [
          { startSeconds: 0, title: 'The headline' },
          { startSeconds: 10, title: 'The numbers' },
          { startSeconds: 20, title: 'What happens next' },
        ],
        cuePoints: [
          { timeMs: 4000, text: 'Where the reporting gaps began' },
          { timeMs: 15000, text: 'The three affected sites', blockRefId: 'blk_table_1' },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Correspondent' },
          { id: 'sp2', name: 'Ravi Menon', role: 'Data editor' },
        ],
      },
    },
  ],

  slide_deck: [
    {
      id: 'carousel',
      label: 'Carousel',
      description: 'One slide at a time, with arrows to move between them.',
      data: {
        layout: 'carousel',
        title: 'Review findings in five slides',
        slides: [
          {
            slideNumber: 1,
            title: 'What we reviewed',
            body: 'Four reporting sites and two years of filings.',
            bullets: ['Four sites', 'Two years', '1,240 filings'],
            sourceAttribution: 'GlobalPulse investigations',
          },
          {
            slideNumber: 2,
            title: 'The headline finding',
            body: 'Three of the four sites had no independent verification step.',
            bullets: ['No second sign-off at three sites', 'Verification was self-reported'],
          },
          {
            slideNumber: 3,
            title: 'How big the gap was',
            body: 'Reported values ran 8 to 19 per cent above verified values.',
            bullets: ['Median overstatement: 12%', 'Worst case: 19%'],
          },
        ],
      },
    },
    {
      id: 'scroll',
      label: 'Scroll',
      description: 'Every slide stacked, for the reader to scroll through.',
      data: {
        layout: 'scroll',
        title: 'Review findings in five slides',
        slides: [
          {
            slideNumber: 1,
            title: 'What we reviewed',
            body: 'Four reporting sites and two years of filings.',
            bullets: ['Four sites', 'Two years', '1,240 filings'],
            sourceAttribution: 'GlobalPulse investigations',
          },
          {
            slideNumber: 2,
            title: 'The headline finding',
            body: 'Three of the four sites had no independent verification step.',
            bullets: ['No second sign-off at three sites', 'Verification was self-reported'],
          },
          {
            slideNumber: 3,
            title: 'How big the gap was',
            body: 'Reported values ran 8 to 19 per cent above verified values.',
            bullets: ['Median overstatement: 12%', 'Worst case: 19%'],
          },
        ],
      },
    },
    {
      id: 'grid',
      label: 'Grid',
      description: 'Every slide as a card, all of them at once.',
      data: {
        layout: 'grid',
        title: 'Review findings in five slides',
        slides: [
          {
            slideNumber: 1,
            title: 'What we reviewed',
            body: 'Four reporting sites and two years of filings.',
            bullets: ['Four sites', 'Two years', '1,240 filings'],
            sourceAttribution: 'GlobalPulse investigations',
          },
          {
            slideNumber: 2,
            title: 'The headline finding',
            body: 'Three of the four sites had no independent verification step.',
            bullets: ['No second sign-off at three sites', 'Verification was self-reported'],
          },
          {
            slideNumber: 3,
            title: 'How big the gap was',
            body: 'Reported values ran 8 to 19 per cent above verified values.',
            bullets: ['Median overstatement: 12%', 'Worst case: 19%'],
          },
        ],
      },
    },
  ],

  embed: [
    {
      id: 'iframe',
      label: 'Player',
      description: 'The embed drawn as a player.',
      data: {
        layout: 'iframe',
        provider: 'youtube',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        title: 'Review panel, full session',
      },
    },
    {
      id: 'card',
      label: 'Card',
      description: 'The embed in a card, with the provider and a link out.',
      data: {
        layout: 'card',
        provider: 'youtube',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        title: 'Review panel, full session',
      },
    },
    {
      id: 'link',
      label: 'Link',
      description: 'The embed as a bare link, for a mention in the text.',
      data: {
        layout: 'link',
        provider: 'youtube',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        title: 'Review panel, full session',
      },
    },
  ],

  video_gallery: [
    {
      id: 'grid',
      label: 'Grid',
      description: 'The films in a grid.',
      data: {
        layout: 'grid',
        title: 'Watch: the review in three minutes',
        description: 'The key moments, cut together by the video desk.',
        videos: [
          {
            id: 'v1',
            url: '/videos/sample-video.mp4',
            title: 'The finding in 90 seconds',
            posterUrl: image('video-poster-1'),
            durationSeconds: 95,
            credit: 'GlobalPulse video desk',
            chapters: [{ startSeconds: 0, title: 'The finding' }],
          },
          {
            id: 'v2',
            url: '/videos/sample-video.mp4',
            title: 'The review director explains',
            posterUrl: image('video-poster-2'),
            durationSeconds: 240,
            credit: 'GlobalPulse video desk',
          },
        ],
        sourceAttribution: 'GlobalPulse video desk',
      },
    },
    {
      id: 'list',
      label: 'List',
      description: 'The films as a list, one after another.',
      data: {
        layout: 'list',
        title: 'Watch: the review in three minutes',
        description: 'The key moments, cut together by the video desk.',
        videos: [
          {
            id: 'v1',
            url: '/videos/sample-video.mp4',
            title: 'The finding in 90 seconds',
            posterUrl: image('video-poster-1'),
            durationSeconds: 95,
            credit: 'GlobalPulse video desk',
            chapters: [{ startSeconds: 0, title: 'The finding' }],
          },
          {
            id: 'v2',
            url: '/videos/sample-video.mp4',
            title: 'The review director explains',
            posterUrl: image('video-poster-2'),
            durationSeconds: 240,
            credit: 'GlobalPulse video desk',
          },
        ],
        sourceAttribution: 'GlobalPulse video desk',
      },
    },
    {
      id: 'featured',
      label: 'Featured',
      description: 'The first film large, with the rest in a row beneath it.',
      data: {
        layout: 'featured',
        title: 'Watch: the review in three minutes',
        description: 'The key moments, cut together by the video desk.',
        videos: [
          {
            id: 'v1',
            url: '/videos/sample-video.mp4',
            title: 'The finding in 90 seconds',
            posterUrl: image('video-poster-1'),
            durationSeconds: 95,
            credit: 'GlobalPulse video desk',
            chapters: [{ startSeconds: 0, title: 'The finding' }],
          },
          {
            id: 'v2',
            url: '/videos/sample-video.mp4',
            title: 'The review director explains',
            posterUrl: image('video-poster-2'),
            durationSeconds: 240,
            credit: 'GlobalPulse video desk',
          },
        ],
        sourceAttribution: 'GlobalPulse video desk',
      },
    },
  ],

  podcast: [
    {
      id: 'card',
      label: 'Card',
      description: 'Each episode as a card, with its artwork.',
      data: {
        layout: 'card',
        title: 'The Grid Review',
        description: 'A weekly conversation about how the numbers are made.',
        episodes: [
          {
            showTitle: 'The Grid Review',
            episodeTitle: 'Who checks the checkers?',
            episodeNumber: 12,
            seasonNumber: 2,
            description: 'Ada Okafor on the review, the guidance, and what changes next.',
            audioUrl: '/audio/sample-briefing.mp3',
            artworkUrl: image('podcast-art'),
            durationSeconds: 2700,
            publishedAt: '2026-10-03',
            chapters: [
              { startSeconds: 0, title: 'Cold open' },
              { startSeconds: 600, title: 'How the gap started' },
              { startSeconds: 1800, title: 'What changes now' },
            ],
            speakers: [
              { id: 'sp1', name: 'Ada Okafor', role: 'Guest' },
              { id: 'sp2', name: 'Nia Bergman', role: 'Host' },
            ],
            explicit: false,
            sourceAttribution: 'GlobalPulse podcasts',
          },
        ],
        sourceAttribution: 'GlobalPulse podcasts',
      },
    },
    {
      id: 'list',
      label: 'List',
      description: 'The episodes as a list of titles and run times.',
      data: {
        layout: 'list',
        title: 'The Grid Review',
        description: 'A weekly conversation about how the numbers are made.',
        episodes: [
          {
            showTitle: 'The Grid Review',
            episodeTitle: 'Who checks the checkers?',
            episodeNumber: 12,
            seasonNumber: 2,
            description: 'Ada Okafor on the review, the guidance, and what changes next.',
            audioUrl: '/audio/sample-briefing.mp3',
            artworkUrl: image('podcast-art'),
            durationSeconds: 2700,
            publishedAt: '2026-10-03',
            chapters: [
              { startSeconds: 0, title: 'Cold open' },
              { startSeconds: 600, title: 'How the gap started' },
              { startSeconds: 1800, title: 'What changes now' },
            ],
            speakers: [
              { id: 'sp1', name: 'Ada Okafor', role: 'Guest' },
              { id: 'sp2', name: 'Nia Bergman', role: 'Host' },
            ],
            explicit: false,
            sourceAttribution: 'GlobalPulse podcasts',
          },
        ],
        sourceAttribution: 'GlobalPulse podcasts',
      },
    },
    {
      id: 'featured',
      label: 'Featured',
      description: 'The latest episode large, with the rest beneath it.',
      data: {
        layout: 'featured',
        title: 'The Grid Review',
        description: 'A weekly conversation about how the numbers are made.',
        episodes: [
          {
            showTitle: 'The Grid Review',
            episodeTitle: 'Who checks the checkers?',
            episodeNumber: 12,
            seasonNumber: 2,
            description: 'Ada Okafor on the review, the guidance, and what changes next.',
            audioUrl: '/audio/sample-briefing.mp3',
            artworkUrl: image('podcast-art'),
            durationSeconds: 2700,
            publishedAt: '2026-10-03',
            chapters: [
              { startSeconds: 0, title: 'Cold open' },
              { startSeconds: 600, title: 'How the gap started' },
              { startSeconds: 1800, title: 'What changes now' },
            ],
            speakers: [
              { id: 'sp1', name: 'Ada Okafor', role: 'Guest' },
              { id: 'sp2', name: 'Nia Bergman', role: 'Host' },
            ],
            explicit: false,
            sourceAttribution: 'GlobalPulse podcasts',
          },
        ],
        sourceAttribution: 'GlobalPulse podcasts',
      },
    },
  ],

  waveform: [
    {
      id: 'bars',
      label: 'Bars',
      description: 'The sound drawn as bars rising from the baseline.',
      data: {
        layout: 'bars',
        title: 'The briefing audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        mediaType: 'audio',
        durationSeconds: 30,
        peaks: [
          0.12, 0.28, 0.44, 0.61, 0.78, 0.92, 0.85, 0.71, 0.55, 0.39, 0.24, 0.15, 0.31, 0.52, 0.74,
          0.88, 0.81, 0.66, 0.48, 0.33, 0.21, 0.36, 0.58, 0.79, 0.94, 0.86, 0.68, 0.5, 0.34, 0.2,
        ],
        segments: [
          { startSeconds: 0, endSeconds: 8, label: 'The headline', blockRefId: 'blk_transcript_1' },
          { startSeconds: 8, endSeconds: 20, label: 'The numbers' },
          { startSeconds: 20, endSeconds: 30, label: 'What happens next' },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
      },
    },
    {
      id: 'waveform',
      label: 'Waveform',
      description: 'The sound drawn as a waveform, mirrored about the centre.',
      data: {
        layout: 'waveform',
        title: 'The briefing audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        mediaType: 'audio',
        durationSeconds: 30,
        peaks: [
          0.12, 0.28, 0.44, 0.61, 0.78, 0.92, 0.85, 0.71, 0.55, 0.39, 0.24, 0.15, 0.31, 0.52, 0.74,
          0.88, 0.81, 0.66, 0.48, 0.33, 0.21, 0.36, 0.58, 0.79, 0.94, 0.86, 0.68, 0.5, 0.34, 0.2,
        ],
        segments: [
          { startSeconds: 0, endSeconds: 8, label: 'The headline', blockRefId: 'blk_transcript_1' },
          { startSeconds: 8, endSeconds: 20, label: 'The numbers' },
          { startSeconds: 20, endSeconds: 30, label: 'What happens next' },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
      },
    },
    {
      id: 'markers',
      label: 'Markers',
      description: 'Only the markers, with no amplitude drawn.',
      data: {
        layout: 'markers',
        title: 'The briefing audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        mediaType: 'audio',
        durationSeconds: 30,
        peaks: [
          0.12, 0.28, 0.44, 0.61, 0.78, 0.92, 0.85, 0.71, 0.55, 0.39, 0.24, 0.15, 0.31, 0.52, 0.74,
          0.88, 0.81, 0.66, 0.48, 0.33, 0.21, 0.36, 0.58, 0.79, 0.94, 0.86, 0.68, 0.5, 0.34, 0.2,
        ],
        segments: [
          { startSeconds: 0, endSeconds: 8, label: 'The headline', blockRefId: 'blk_transcript_1' },
          { startSeconds: 8, endSeconds: 20, label: 'The numbers' },
          { startSeconds: 20, endSeconds: 30, label: 'What happens next' },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
      },
    },
  ],

  transcript: [
    {
      id: 'lines',
      label: 'Lines',
      description: 'A line at a time, with a timestamp against each.',
      data: {
        layout: 'lines',
        title: 'The briefing transcript',
        mediaType: 'audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        language: 'en',
        segments: [
          {
            startSeconds: 0,
            speaker: 'Nia Bergman',
            text: 'The review covered four reporting sites and two years of filings.',
            confidence: 0.98,
          },
          {
            startSeconds: 7,
            speaker: 'Nia Bergman',
            text: 'Three of the four had no independent verification step at all.',
            confidence: 0.97,
          },
          {
            startSeconds: 15,
            speaker: 'Ravi Menon',
            text: 'And the median overstatement was nine point four per cent.',
            confidence: 0.94,
          },
          {
            startSeconds: 24,
            speaker: 'Nia Bergman',
            text: 'A second sign-off is now mandatory, and reporting is published quarterly.',
            confidence: 0.96,
          },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Correspondent' },
          { id: 'sp2', name: 'Ravi Menon', role: 'Data editor' },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
        methodology: 'Transcribed automatically and reviewed by the audio desk.',
      },
    },
    {
      id: 'speaker',
      label: 'By speaker',
      description: 'Grouped under the speaker who said them.',
      data: {
        layout: 'speaker',
        title: 'The briefing transcript',
        mediaType: 'audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        language: 'en',
        segments: [
          {
            startSeconds: 0,
            speaker: 'Nia Bergman',
            text: 'The review covered four reporting sites and two years of filings.',
            confidence: 0.98,
          },
          {
            startSeconds: 7,
            speaker: 'Nia Bergman',
            text: 'Three of the four had no independent verification step at all.',
            confidence: 0.97,
          },
          {
            startSeconds: 15,
            speaker: 'Ravi Menon',
            text: 'And the median overstatement was nine point four per cent.',
            confidence: 0.94,
          },
          {
            startSeconds: 24,
            speaker: 'Nia Bergman',
            text: 'A second sign-off is now mandatory, and reporting is published quarterly.',
            confidence: 0.96,
          },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Correspondent' },
          { id: 'sp2', name: 'Ravi Menon', role: 'Data editor' },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
        methodology: 'Transcribed automatically and reviewed by the audio desk.',
      },
    },
    {
      id: 'paragraphs',
      label: 'Paragraphs',
      description: 'Run together into paragraphs, to read rather than to scan.',
      data: {
        layout: 'paragraphs',
        title: 'The briefing transcript',
        mediaType: 'audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        language: 'en',
        segments: [
          {
            startSeconds: 0,
            speaker: 'Nia Bergman',
            text: 'The review covered four reporting sites and two years of filings.',
            confidence: 0.98,
          },
          {
            startSeconds: 7,
            speaker: 'Nia Bergman',
            text: 'Three of the four had no independent verification step at all.',
            confidence: 0.97,
          },
          {
            startSeconds: 15,
            speaker: 'Ravi Menon',
            text: 'And the median overstatement was nine point four per cent.',
            confidence: 0.94,
          },
          {
            startSeconds: 24,
            speaker: 'Nia Bergman',
            text: 'A second sign-off is now mandatory, and reporting is published quarterly.',
            confidence: 0.96,
          },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Correspondent' },
          { id: 'sp2', name: 'Ravi Menon', role: 'Data editor' },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
        methodology: 'Transcribed automatically and reviewed by the audio desk.',
      },
    },
  ],
};
