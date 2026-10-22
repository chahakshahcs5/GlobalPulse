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
      id: 'landscape',
      label: 'Landscape 16:9',
      description: 'The default editorial image treatment.',
      data: {
        url: image('solar-array-1'),
        altText: 'Rows of solar panels stretching to the horizon under a low sun',
        caption: 'The Northfield array at first light, six months after commissioning.',
        aspectRatio: '16:9',
        credit: 'Nia Bergman / GlobalPulse',
        sourceAttribution: 'Northfield Energy',
      },
    },
    {
      id: 'square',
      label: 'Square 1:1',
      description: 'A square crop for a sidebar or a social card.',
      data: {
        url: image('turbine-9', 900, 900),
        altText: 'A single wind turbine seen from the control room window',
        caption: 'Turbine 9 is the largest in the Northfield cluster.',
        aspectRatio: '1:1',
        credit: 'Nia Bergman / GlobalPulse',
      },
    },
    {
      id: 'portrait',
      label: 'Portrait 9:16',
      description: 'A vertical crop for mobile-first layouts.',
      data: {
        url: image('grid-repair-4', 675, 1200),
        altText: 'A technician walking a long line of transmission pylons',
        caption: 'Line crews walk the full corridor every six weeks.',
        aspectRatio: '9:16',
        credit: 'Field Desk / GlobalPulse',
      },
    },
    {
      id: 'classic',
      label: 'Classic 4:3',
      description: 'A four-by-three crop, for a card in a column.',
      data: {
        url: image('control-room-2', 1200, 900),
        altText: 'An engineer at a console reading a bank of relay panels',
        caption: 'Harbour East control room, during the winter peak test.',
        aspectRatio: '4:3',
        credit: 'Nia Bergman / GlobalPulse',
      },
    },
    {
      id: 'panorama',
      label: 'Panorama 21:9',
      description: 'A wide crop, for a banner above the story.',
      data: {
        url: image('east-corridor-wide', 2100, 900),
        altText: 'The eastern corridor running to the horizon under a low winter sun',
        caption: 'The eastern corridor, photographed from the Ridgeway pylon.',
        aspectRatio: '21:9',
        credit: 'Field Desk / GlobalPulse',
        sourceAttribution: 'Northfield Energy',
      },
    },
    {
      id: 'uncaptioned',
      label: 'No caption or credit',
      description: 'A bare image — the treatment used inside a gallery.',
      data: {
        url: image('meter-reader-7'),
        altText: 'A meter reader logging a reading at a substation',
        aspectRatio: '16:9',
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
      id: 'two-up',
      label: 'Two images',
      description: 'The smallest a gallery can be.',
      data: {
        title: 'Before and after the second sign-off',
        layout: 'grid',
        images: [
          {
            url: image('two-up-a'),
            altText: 'A blank second-signature column on a printed filing',
            caption: 'The filing template in 2024, with the second column unused.',
          },
          {
            url: image('two-up-b'),
            altText: 'The same template with a second signature on every row',
            caption: 'The same template in 2026.',
          },
        ],
      },
    },
    {
      id: 'six-up',
      label: 'Six images',
      description: 'A longer gallery, with credits on every picture.',
      data: {
        title: 'Six weeks on the eastern spur',
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
          {
            url: image('six-d'),
            altText: 'Two engineers comparing readings on a screen',
            caption: 'Week four: the first cross-check.',
            credit: 'Field Desk',
          },
          {
            url: image('six-e'),
            altText: 'A repaired line under a grey sky',
            caption: 'Week five: the line back in service.',
            credit: 'Field Desk',
          },
          {
            url: image('six-f'),
            altText: 'A completed inspection sheet on a desk',
            caption: 'Week six: the paperwork, signed twice.',
            credit: 'Field Desk',
          },
        ],
      },
    },
  ],

  annotated_image: [
    {
      id: 'satellite',
      label: 'Satellite annotations',
      description: 'Percentage-positioned markers on a satellite image.',
      data: {
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
            sourceId: 'src_satellite_pass_2',
          },
          {
            id: 'a2',
            xPercent: 63,
            yPercent: 38,
            label: 'Flood extent',
            description: 'The waterline against the secondary road.',
            sourceId: 'src_satellite_pass_2',
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
      id: 'single',
      label: 'One annotation',
      description: 'A single marker, for one point on the picture.',
      data: {
        url: image('harbour-single-point'),
        altText: 'The harbour basin, seen from the eastern breakwater',
        caption: 'The berth where the first filing was checked.',
        annotations: [
          {
            id: 'a1',
            xPercent: 55,
            yPercent: 44,
            label: 'The verified meter',
            description: 'The meter the review team read against the published figure.',
            sourceId: 'src_review_data',
          },
        ],
      },
    },
    {
      id: 'all-sourced',
      label: 'Every annotation sourced',
      description: 'Three markers, each tied to a registered source.',
      data: {
        url: image('delta-satellite-sourced'),
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
            sourceId: 'src_satellite_pass_2',
          },
          {
            id: 'a2',
            xPercent: 63,
            yPercent: 38,
            label: 'Flood extent',
            description: 'The waterline against the secondary road.',
            sourceId: 'src_satellite_pass_2',
          },
          {
            id: 'a3',
            xPercent: 22,
            yPercent: 71,
            label: 'Levee reinforcement',
            description: 'Emergency fill placed over eight days.',
            sourceId: 'src_satellite_pass_3',
          },
        ],
      },
    },
    {
      id: 'dense',
      label: 'Six annotations',
      description: 'A crowded picture, with a marker on every feature.',
      data: {
        url: image('substation-annotated'),
        altText: 'A substation yard seen from above, with every bay marked',
        caption: 'The 400 kV yard. Six features on this picture are named in the review.',
        credit: 'Field Desk',
        annotations: [
          {
            id: 'a1',
            xPercent: 18,
            yPercent: 30,
            label: 'Bay 1',
            description: 'Where the reported value enters the site record.',
          },
          {
            id: 'a2',
            xPercent: 34,
            yPercent: 44,
            label: 'Meter bank',
            description: 'The independently verified reading point.',
            sourceId: 'src_review_data',
          },
          {
            id: 'a3',
            xPercent: 52,
            yPercent: 58,
            label: 'Transformer 3',
            description: 'The unit whose reading was misclassified as demand.',
          },
          {
            id: 'a4',
            xPercent: 68,
            yPercent: 36,
            label: 'Backup supply',
            description: 'Taken out of service for eleven weeks.',
          },
          {
            id: 'a5',
            xPercent: 79,
            yPercent: 66,
            label: 'Sign-off desk',
            description: 'Where the second signature should have been.',
            sourceId: 'src_review_report',
          },
          {
            id: 'a6',
            xPercent: 44,
            yPercent: 76,
            label: 'Spill point',
            description: 'Where the recorded figure and the metered one diverge.',
          },
        ],
      },
    },
  ],

  image_diff: [
    {
      id: 'horizontal',
      label: 'Horizontal split',
      description: 'Before and after, side by side.',
      data: {
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
      id: 'vertical',
      label: 'Vertical split',
      description: 'A vertical wipe for tall imagery.',
      data: {
        beforeUrl: image('before-city', 800, 1200),
        afterUrl: image('after-city', 800, 1200),
        beforeLabel: '2023',
        afterLabel: '2026',
        caption: 'Redevelopment of the eastern district.',
        orientation: 'vertical',
        defaultSplitPercent: 45,
      },
    },
    {
      id: 'horizontal-70',
      label: 'Split at 70%',
      description: 'A horizontal split that opens further to the right.',
      data: {
        beforeUrl: image('before-corridor'),
        afterUrl: image('after-corridor'),
        beforeLabel: 'March 2024',
        afterLabel: 'March 2026',
        caption: 'The eastern corridor, before the second sign-off and after it.',
        orientation: 'horizontal',
        defaultSplitPercent: 70,
        credit: 'GlobalPulse archive',
      },
    },
    {
      id: 'unlabelled',
      label: 'Unlabelled',
      description: 'A split with no captions, no credit and no labels.',
      data: {
        beforeUrl: image('bare-before'),
        afterUrl: image('bare-after'),
        orientation: 'horizontal',
        defaultSplitPercent: 50,
      },
    },
  ],

  video: [
    {
      id: 'report',
      label: 'Report with chapters',
      description: 'A video with poster art, chapters and a transcript.',
      data: {
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
      id: 'vertical',
      label: 'Vertical 9:16',
      description: 'A vertical video, for a mobile-first story.',
      data: {
        url: '/videos/sample-video.mp4',
        posterUrl: image('video-poster-vertical', 675, 1200),
        aspectRatio: '9:16',
        caption: 'The finding, cut for a phone.',
        durationSeconds: 15,
        transcription: 'Three of the four sites had no independent verification step at all.',
      },
    },
    {
      id: 'square',
      label: 'Square 1:1',
      description: 'A square video, for a social card or a feed.',
      data: {
        url: '/videos/sample-video.mp4',
        posterUrl: image('video-poster-square', 900, 900),
        aspectRatio: '1:1',
        caption: 'The review, in ninety seconds.',
        durationSeconds: 15,
        chapters: [{ startSeconds: 0, title: 'The finding' }],
      },
    },
    {
      id: 'no-chapters',
      label: 'No chapters',
      description: 'A video with nothing but a poster and a caption.',
      data: {
        url: '/videos/sample-video.mp4',
        posterUrl: image('video-poster-plain'),
        aspectRatio: '16:9',
        caption: 'Footage from the eastern spur, filmed during the winter peak.',
      },
    },
    {
      id: 'long-form',
      label: 'Long form with transcript',
      description: 'A full-length video with a written transcript.',
      data: {
        url: '/videos/sample-video.mp4',
        posterUrl: image('video-poster-long'),
        aspectRatio: '16:9',
        caption: 'The full review panel, uncut.',
        durationSeconds: 2700,
        transcription:
          'The panel was asked, three times, whether the gap could have been deliberate. The answer was the same each time: nothing in the record evidences intent, and the sites with the weakest verification step are the sites with the largest gap.',
        chapters: [
          { startSeconds: 0, title: 'Welcome' },
          { startSeconds: 420, title: 'How the review was carried out' },
          { startSeconds: 1500, title: 'What the sites said' },
          { startSeconds: 2400, title: 'Recommendations' },
        ],
        transcriptSegments: [
          {
            startSeconds: 0,
            speaker: 'Nia Bergman',
            text: 'The panel convened in public for the first time this morning.',
          },
          {
            startSeconds: 420,
            endSeconds: 900,
            speaker: 'Dr. Amara Okafor',
            text: 'Two analysts re-checked every filing in the sample against the meters.',
          },
          {
            startSeconds: 2400,
            speaker: 'Nia Bergman',
            text: 'The recommendations are published in full alongside these findings.',
          },
        ],
      },
    },
  ],

  audio: [
    {
      id: 'briefing',
      label: 'Audio briefing',
      description: 'Narration with chapters and cue points.',
      data: {
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
      id: 'bare',
      label: 'Bare audio',
      description: 'An audio file with nothing but a title.',
      data: {
        url: '/audio/sample-briefing.mp3',
        title: 'The morning briefing',
      },
    },
    {
      id: 'with-transcript',
      label: 'With a transcript',
      description: 'An audio file and the text of what was said.',
      data: {
        url: '/audio/sample-briefing.mp3',
        title: 'The briefing: what the review found',
        narrator: 'Nia Bergman',
        durationSeconds: 30,
        language: 'en',
        transcript:
          'A full recording of the morning briefing, with the numbers from the review read out in sequence.',
      },
    },
    {
      id: 'second-language',
      label: 'Another language',
      description: 'An audio file published in a second language.',
      data: {
        url: '/audio/sample-briefing.mp3',
        title: 'Le pointbriefing : ce que la revue a trouvé',
        narrator: 'Amara Okafor',
        durationSeconds: 30,
        language: 'fr',
        chapters: [
          { startSeconds: 0, title: 'Le titre' },
          { startSeconds: 10, title: 'Les chiffres' },
          { startSeconds: 20, title: 'La suite' },
        ],
      },
    },
    {
      id: 'long-form',
      label: 'Long form',
      description: 'A long recording, with cue points into the story.',
      data: {
        url: '/audio/sample-briefing.mp3',
        title: 'The Grid Review, episode twelve: who checks the checkers?',
        narrator: 'Nia Bergman',
        durationSeconds: 2700,
        language: 'en',
        transcript:
          'The full episode, with the review director and the data editor on what the filings actually show and what the guidance should have said.',
        chapters: [
          { startSeconds: 0, title: 'Cold open' },
          { startSeconds: 600, title: 'How the gap started' },
          { startSeconds: 1800, title: 'What changes now' },
        ],
        cuePoints: [
          { timeMs: 300000, text: 'The 2022 guidance, and what it actually said' },
          { timeMs: 900000, text: 'The three affected sites' },
          { timeMs: 1500000, text: 'Why no one found this earlier', blockRefId: 'blk_timeline_1' },
          { timeMs: 2400000, text: 'The recommendations, in full' },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Host' },
          { id: 'sp2', name: 'Dr. Amara Okafor', role: 'Guest' },
          { id: 'sp3', name: 'Ravi Menon', role: 'Data editor' },
        ],
      },
    },
  ],

  slide_deck: [
    {
      id: 'findings',
      label: 'Findings deck',
      description: 'Five slides with bullets and attribution.',
      data: {
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
          {
            slideNumber: 4,
            title: 'What the sites said',
            body: 'Two sites said the guidance was ambiguous. One site said it was never received.',
            bullets: ['Guidance ambiguity', 'One site never received it'],
          },
          {
            slideNumber: 5,
            title: 'What changes',
            body: 'A mandatory second sign-off, published quarterly.',
            bullets: ['Second sign-off required', 'Quarterly public reporting'],
          },
        ],
      },
    },
    {
      id: 'image-led',
      label: 'Image-led',
      description: 'Slides that carry a picture as well as the words.',
      data: {
        title: 'The review, in pictures',
        slides: [
          {
            slideNumber: 1,
            title: 'Northfield',
            imageUrl: image('deck-northfield'),
            body: 'The cleanest record of the four: 412 filings, every one verified.',
            bullets: ['99.2% verified', 'Median gap 2.8%'],
          },
          {
            slideNumber: 2,
            title: 'Harbour East',
            imageUrl: image('deck-harbour'),
            body: 'The largest gap: 14.2 per cent at the median.',
            bullets: ['No second sign-off', 'Median gap 14.2%'],
          },
          {
            slideNumber: 3,
            title: 'Ridgeway',
            imageUrl: image('deck-ridgeway'),
            body: 'The only site that signed every filing throughout the review period.',
            bullets: ['Signed throughout', 'Median gap 5.1%'],
          },
          {
            slideNumber: 4,
            title: 'Coastal',
            imageUrl: image('deck-coastal'),
            body: 'No verification step at all, and the smallest sample of the four.',
            bullets: ['No second sign-off', 'Median gap 11.8%'],
          },
        ],
      },
    },
    {
      id: 'two-slides',
      label: 'Two slides',
      description: 'The smallest a deck can be.',
      data: {
        title: 'The recommendation',
        slides: [
          {
            slideNumber: 1,
            title: 'What we found',
            body: 'Three of the four sites published figures nobody had checked.',
          },
          {
            slideNumber: 2,
            title: 'What changes',
            body: 'A mandatory second sign-off, and quarterly public reporting.',
          },
        ],
      },
    },
    {
      id: 'attributed',
      label: 'Attributed throughout',
      description: 'Every slide carries its own source attribution.',
      data: {
        title: 'The finding, with its sources',
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
            bullets: ['No second sign-off at three sites'],
            sourceAttribution: 'Office of the Independent Grid Review',
          },
          {
            slideNumber: 3,
            title: 'How big the gap was',
            body: 'Reported values ran 8 to 19 per cent above verified values.',
            bullets: ['Median overstatement: 9.4%', 'Worst case: 19%'],
            sourceAttribution: 'GlobalPulse data desk',
          },
        ],
      },
    },
  ],

  embed: [
    {
      id: 'youtube',
      label: 'YouTube',
      description: 'A video embed.',
      data: {
        provider: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Review panel, full session',
      },
    },
    {
      id: 'bluesky',
      label: 'Bluesky',
      description: 'A social post embed.',
      data: {
        provider: 'bluesky',
        url: 'https://bsky.app/profile/globalpulse.bsky.social/post/3k2',
        title: 'Post on the review findings',
      },
    },
    {
      id: 'github',
      label: 'GitHub',
      description: 'A code or dataset repository.',
      data: {
        provider: 'github',
        url: 'https://github.com/globalpulse/grid-review-dataset',
        title: 'The dataset behind this story',
      },
    },
    {
      id: 'youtube-embed',
      label: 'YouTube embed URL',
      description: 'The embeddable form of a YouTube URL, which is drawn as a player.',
      data: {
        provider: 'youtube',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        title: 'Review panel, full session',
      },
    },
    {
      id: 'twitter',
      label: 'Twitter',
      description: 'A post embed.',
      data: {
        provider: 'twitter',
        url: 'https://twitter.com/globalpulse/status/1812345678901234567',
        title: 'The authority publishes the findings',
      },
    },
    {
      id: 'generic',
      label: 'Generic link',
      description: 'Anything else, shown as a link with its title.',
      data: {
        provider: 'generic',
        url: 'https://example.org/independent-grid-review-2026',
        title: 'The Independent Grid Review, in full',
      },
    },
  ],

  video_gallery: [
    {
      id: 'gallery',
      label: 'Video gallery',
      description: 'Several videos with poster art and chapters.',
      data: {
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
      id: 'one-video',
      label: 'One video',
      description: 'A gallery with a single film in it.',
      data: {
        title: 'Watch: the finding in ninety seconds',
        videos: [
          {
            id: 'v1',
            url: '/videos/sample-video.mp4',
            title: 'The finding in 90 seconds',
            posterUrl: image('video-poster-1'),
            durationSeconds: 95,
            credit: 'GlobalPulse video desk',
          },
        ],
      },
    },
    {
      id: 'five-videos',
      label: 'Five videos',
      description: 'A longer gallery, with chapters on every film.',
      data: {
        title: 'Watch: the review, piece by piece',
        description: 'The panel, the sites, the data, and the road out.',
        videos: [
          {
            id: 'v1',
            url: '/videos/sample-video.mp4',
            title: 'The finding in 90 seconds',
            posterUrl: image('video-poster-1'),
            durationSeconds: 95,
            caption: 'The headline, and nothing else.',
            credit: 'GlobalPulse video desk',
            chapters: [
              { startSeconds: 0, title: 'The finding' },
              { startSeconds: 40, title: 'Why it matters' },
            ],
          },
          {
            id: 'v2',
            url: '/videos/sample-video.mp4',
            title: 'The review director explains',
            posterUrl: image('video-poster-2'),
            durationSeconds: 240,
            caption: 'Dr. Okafor on the guidance, and on who bears the burden.',
            credit: 'GlobalPulse video desk',
            chapters: [
              { startSeconds: 0, title: 'The guidance' },
              { startSeconds: 120, title: 'The burden' },
            ],
          },
          {
            id: 'v3',
            url: '/videos/sample-video.mp4',
            title: 'What the data shows',
            posterUrl: image('video-poster-3'),
            durationSeconds: 180,
            caption: 'Ravi Menon walks through the median gap.',
            credit: 'GlobalPulse data desk',
          },
          {
            id: 'v4',
            url: '/videos/sample-video.mp4',
            title: 'Inside Harbour East',
            posterUrl: image('video-poster-4'),
            durationSeconds: 320,
            caption: 'The site with the largest gap, filmed over two days.',
            credit: 'Field Desk',
          },
          {
            id: 'v5',
            url: '/videos/sample-video.mp4',
            title: 'What changes now',
            posterUrl: image('video-poster-5'),
            durationSeconds: 75,
            caption: 'The recommendation, in one minute.',
            credit: 'GlobalPulse video desk',
          },
        ],
        sourceAttribution: 'GlobalPulse video desk',
      },
    },
    {
      id: 'with-transcripts',
      label: 'With transcripts',
      description: 'Films that carry a written transcript alongside them.',
      data: {
        title: 'Watch: with transcripts',
        description: 'Every film here is published with its transcript.',
        videos: [
          {
            id: 'v1',
            url: '/videos/sample-video.mp4',
            title: 'The finding in 90 seconds',
            posterUrl: image('video-poster-1'),
            durationSeconds: 95,
            transcriptSegments: [
              {
                startSeconds: 0,
                speaker: 'Nia Bergman',
                text: 'Three of the four sites that report the country’s grid figures checked nothing.',
              },
              {
                startSeconds: 30,
                speaker: 'Nia Bergman',
                text: 'The median gap between the reported and the verified figures was 9.4 per cent.',
              },
              {
                startSeconds: 60,
                speaker: 'Nia Bergman',
                text: 'A second sign-off is now mandatory, and the results are published quarterly.',
              },
            ],
          },
          {
            id: 'v2',
            url: '/videos/sample-video.mp4',
            title: 'The review director explains',
            posterUrl: image('video-poster-2'),
            durationSeconds: 240,
            transcriptSegments: [
              {
                startSeconds: 0,
                speaker: 'Dr. Amara Okafor',
                text: 'We were not looking for misconduct. We were looking for a second pair of eyes.',
              },
              {
                startSeconds: 120,
                speaker: 'Dr. Amara Okafor',
                text: 'At three of the four sites, there was no second pair of eyes to be had.',
              },
            ],
          },
        ],
        sourceAttribution: 'GlobalPulse video desk',
      },
    },
    {
      id: 'bare',
      label: 'Bare gallery',
      description: 'Films with nothing but a title and a poster.',
      data: {
        title: 'Watch',
        videos: [
          {
            id: 'v1',
            url: '/videos/sample-video.mp4',
            title: 'The finding in 90 seconds',
          },
        ],
      },
    },
  ],

  podcast: [
    {
      id: 'podcast',
      label: 'Podcast episode',
      description: 'A show with one episode, chapters and speakers.',
      data: {
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
      id: 'three-episodes',
      label: 'Three episodes',
      description: 'A back catalogue, not just the latest episode.',
      data: {
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
          },
          {
            showTitle: 'The Grid Review',
            episodeTitle: 'The optional step',
            episodeNumber: 11,
            seasonNumber: 2,
            description: 'How a recommended practice became a practice nobody performed.',
            audioUrl: '/audio/sample-briefing.mp3',
            artworkUrl: image('podcast-art'),
            durationSeconds: 2400,
            publishedAt: '2026-09-26',
          },
          {
            showTitle: 'The Grid Review',
            episodeTitle: 'Eleven per cent',
            episodeNumber: 10,
            seasonNumber: 2,
            description: 'Ravi Menon on the first site-level numbers, and what they did not show.',
            audioUrl: '/audio/sample-briefing.mp3',
            artworkUrl: image('podcast-art'),
            durationSeconds: 2550,
            publishedAt: '2026-09-19',
          },
        ],
        sourceAttribution: 'GlobalPulse podcasts',
      },
    },
    {
      id: 'with-transcript',
      label: 'With a transcript',
      description: 'An episode that publishes its own transcript.',
      data: {
        title: 'The Grid Review',
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
            transcript:
              'The panel was asked, three times, whether the gap could have been deliberate. The answer was the same each time: nothing in the record evidences intent.',
            chapters: [
              { startSeconds: 0, title: 'Cold open' },
              { startSeconds: 600, title: 'How the gap started' },
              { startSeconds: 1800, title: 'What changes now' },
            ],
          },
        ],
        sourceAttribution: 'GlobalPulse podcasts',
      },
    },
    {
      id: 'explicit',
      label: 'Explicit',
      description: 'An episode marked as containing strong language.',
      data: {
        title: 'The Grid Review',
        episodes: [
          {
            showTitle: 'The Grid Review',
            episodeTitle: 'Angry about the guidance',
            episodeNumber: 13,
            seasonNumber: 2,
            description:
              'The operator’s response, and a frank discussion of how a reporting site is run day to day.',
            audioUrl: '/audio/sample-briefing.mp3',
            artworkUrl: image('podcast-art'),
            durationSeconds: 2850,
            publishedAt: '2026-10-10',
            explicit: true,
            speakers: [
              { id: 'sp1', name: 'Nia Bergman', role: 'Host' },
              { id: 'sp2', name: 'Ravi Menon', role: 'Data editor' },
            ],
          },
        ],
        sourceAttribution: 'GlobalPulse podcasts',
      },
    },
    {
      id: 'with-episode-link',
      label: 'With an episode link',
      description: 'An episode that also links out to its own page.',
      data: {
        title: 'The Grid Review',
        episodes: [
          {
            showTitle: 'The Grid Review',
            episodeTitle: 'Who checks the checkers?',
            episodeNumber: 12,
            seasonNumber: 2,
            description: 'Ada Okafor on the review, the guidance, and what changes next.',
            audioUrl: '/audio/sample-briefing.mp3',
            episodeUrl: 'https://example.org/podcasts/grid-review/12',
            artworkUrl: image('podcast-art'),
            durationSeconds: 2700,
            publishedAt: '2026-10-03',
          },
        ],
        sourceAttribution: 'GlobalPulse podcasts',
      },
    },
  ],

  waveform: [
    {
      id: 'waveform',
      label: 'Waveform',
      description: 'Amplitude samples with cue segments.',
      data: {
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
      id: 'video',
      label: 'Video waveform',
      description: 'The same treatment, drawn over a film.',
      data: {
        title: 'The review panel',
        mediaUrl: '/videos/sample-video.mp4',
        mediaType: 'video',
        durationSeconds: 15,
        peaks: [
          0.22, 0.41, 0.35, 0.58, 0.72, 0.64, 0.81, 0.9, 0.77, 0.55, 0.48, 0.62, 0.71, 0.59, 0.44,
          0.37, 0.52, 0.68, 0.84, 0.76, 0.63, 0.41, 0.29, 0.46, 0.61, 0.73, 0.55, 0.38, 0.26, 0.18,
        ],
        segments: [
          { startSeconds: 0, endSeconds: 5, label: 'The question' },
          { startSeconds: 5, endSeconds: 11, label: 'The findings' },
          { startSeconds: 11, endSeconds: 15, label: 'The recommendations' },
        ],
        sourceAttribution: 'GlobalPulse video desk',
      },
    },
    {
      id: 'minimal',
      label: 'Minimal',
      description: 'The shape of the sound, with no markers at all.',
      data: {
        mediaUrl: '/audio/sample-briefing.mp3',
        mediaType: 'audio',
        durationSeconds: 30,
        peaks: [0.1, 0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.2, 0.35, 0.55, 0.75, 0.85, 0.65, 0.45],
      },
    },
    {
      id: 'many-segments',
      label: 'Six segments',
      description: 'A long recording, marked every few minutes.',
      data: {
        title: 'The Grid Review, episode twelve',
        mediaUrl: '/audio/sample-briefing.mp3',
        mediaType: 'audio',
        durationSeconds: 2700,
        peaks: [
          0.12, 0.34, 0.56, 0.71, 0.89, 0.93, 0.81, 0.64, 0.42, 0.28, 0.47, 0.68, 0.85, 0.74, 0.52,
          0.33, 0.19, 0.41, 0.63, 0.82, 0.9, 0.72, 0.55, 0.37, 0.24, 0.44, 0.66, 0.79, 0.58, 0.31,
        ],
        segments: [
          { startSeconds: 0, endSeconds: 300, label: 'Cold open' },
          { startSeconds: 300, endSeconds: 900, label: 'How the gap started' },
          { startSeconds: 900, endSeconds: 1500, label: 'The three affected sites' },
          { startSeconds: 1500, endSeconds: 2100, label: 'Why no one found this earlier' },
          { startSeconds: 2100, endSeconds: 2550, label: 'The recommendations' },
          { startSeconds: 2550, endSeconds: 2700, label: 'What to watch for' },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
      },
    },
  ],

  transcript: [
    {
      id: 'transcript',
      label: 'Transcript',
      description: 'Timestamped segments with speaker attribution.',
      data: {
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
      id: 'video',
      label: 'Video transcript',
      description: 'A transcript of a film, rather than of an audio file.',
      data: {
        title: 'The review panel transcript',
        mediaType: 'video',
        mediaUrl: '/videos/sample-video.mp4',
        language: 'en',
        segments: [
          {
            startSeconds: 0,
            speaker: 'Nia Bergman',
            text: 'The panel convened in public for the first time this morning.',
            confidence: 0.99,
          },
          {
            startSeconds: 6,
            speaker: 'Dr. Amara Okafor',
            text: 'Two analysts re-checked every filing in the sample against the meters.',
            confidence: 0.96,
          },
          {
            startSeconds: 12,
            speaker: 'Dr. Amara Okafor',
            text: 'The gap was the same size in every year, and it was largest where the check was missing.',
            confidence: 0.93,
          },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Correspondent' },
          { id: 'sp2', name: 'Dr. Amara Okafor', role: 'Guest' },
        ],
        sourceAttribution: 'GlobalPulse video desk',
        methodology: 'Transcribed automatically and reviewed by the video desk.',
      },
    },
    {
      id: 'no-confidence',
      label: 'Without confidence',
      description: 'A transcript with no score on each line.',
      data: {
        title: 'The briefing transcript',
        mediaType: 'audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        language: 'en',
        segments: [
          {
            startSeconds: 0,
            speaker: 'Nia Bergman',
            text: 'The review covered four reporting sites and two years of filings.',
          },
          {
            startSeconds: 7,
            speaker: 'Nia Bergman',
            text: 'Three of the four had no independent verification step at all.',
          },
          {
            startSeconds: 15,
            speaker: 'Ravi Menon',
            text: 'And the median overstatement was nine point four per cent.',
          },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
      },
    },
    {
      id: 'many-segments',
      label: 'Ten segments',
      description: 'A long transcript, one segment at a time.',
      data: {
        title: 'The Grid Review, episode twelve',
        mediaType: 'audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        language: 'en',
        segments: [
          {
            startSeconds: 0,
            speaker: 'Nia Bergman',
            text: 'This is The Grid Review.',
            confidence: 0.99,
          },
          {
            startSeconds: 8,
            speaker: 'Nia Bergman',
            text: 'Today: who checks the people who check the numbers.',
            confidence: 0.98,
          },
          {
            startSeconds: 21,
            speaker: 'Ravi Menon',
            text: 'The short answer, for a while, was nobody.',
            confidence: 0.95,
          },
          {
            startSeconds: 44,
            speaker: 'Nia Bergman',
            text: 'Four sites filed the country’s grid figures over two years.',
            confidence: 0.97,
          },
          {
            startSeconds: 63,
            speaker: 'Ravi Menon',
            text: 'And at three of the four, the same person signed every filing.',
            confidence: 0.96,
          },
          {
            startSeconds: 85,
            speaker: 'Dr. Amara Okafor',
            text: 'We were not looking for misconduct. We were looking for a second pair of eyes.',
            confidence: 0.94,
          },
          {
            startSeconds: 120,
            speaker: 'Dr. Amara Okafor',
            text: 'At three of the four sites, there was no second pair of eyes to be had.',
            confidence: 0.93,
          },
          {
            startSeconds: 168,
            speaker: 'Ravi Menon',
            text: 'The median gap was 9.4 per cent, and it was the same in every year.',
            confidence: 0.97,
          },
          {
            startSeconds: 210,
            speaker: 'Dr. Amara Okafor',
            text: 'An optional step is not a step.',
            confidence: 0.98,
          },
          {
            startSeconds: 250,
            speaker: 'Nia Bergman',
            text: 'A second sign-off is now mandatory, and the results are published quarterly.',
            confidence: 0.96,
          },
        ],
        speakers: [
          { id: 'sp1', name: 'Nia Bergman', role: 'Host' },
          { id: 'sp2', name: 'Ravi Menon', role: 'Data editor' },
          { id: 'sp3', name: 'Dr. Amara Okafor', role: 'Guest' },
        ],
        sourceAttribution: 'GlobalPulse audio desk',
        methodology: 'Transcribed automatically and reviewed by the audio desk.',
      },
    },
    {
      id: 'no-speakers',
      label: 'Without speakers',
      description: 'A transcript with no speaker list and no attributions.',
      data: {
        title: 'The briefing transcript',
        mediaType: 'audio',
        mediaUrl: '/audio/sample-briefing.mp3',
        language: 'en',
        segments: [
          {
            startSeconds: 0,
            text: 'The review covered four reporting sites and two years of filings.',
          },
          {
            startSeconds: 7,
            text: 'Three of the four had no independent verification step at all.',
          },
          { startSeconds: 15, text: 'And the median overstatement was nine point four per cent.' },
          {
            startSeconds: 24,
            text: 'A second sign-off is now mandatory, and reporting is published quarterly.',
          },
        ],
      },
    },
  ],
};
