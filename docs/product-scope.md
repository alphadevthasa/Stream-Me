# Stream Me MVP scope

## Decisions

- iOS and Android app shells are native. The Reels and Live section uses React Native.
- All registered users may watch and upload Reels.
- Only admin-approved creators may begin a Live broadcast during beta.
- The first feed can be chronological; recommendations are a later milestone.
- Reporting, blocking, admin review and moderation are part of MVP.

## Milestones

1. Native app shell and React Native Stream section with sample HLS playback.
2. Accounts, profiles and creator application states.
3. Reel upload, processing, HLS delivery and paginated feed.
4. Likes, comments and content reporting.
5. Approved-creator Live broadcast, viewing and live comments.
6. Admin moderation, device testing and beta release.

## First-slice acceptance

- Beranda is rendered by native UI on iOS and Android.
- Stream is rendered by React Native on iOS and Android.
- A remote HLS video loads, plays, can be paused and resumed.
- Leaving Stream stops playback; returning starts a fresh player.
- Loading and playback errors are visible.
- Both screens fit the device without clipping or navigation overlap.

The HLS stream is a test fixture, not Stream Me content. Backend endpoints,
creator approval, uploads, social actions and Live broadcast are not included
in this first slice.
