import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Video from 'react-native-video';
import {SafeAreaProvider, SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {LiveLobby} from './LiveLobby';
import {LiveRoomScreen} from './LiveRoom';
import type {LiveRole, LiveSession} from './LiveRoom';
import {liveApiBase} from './liveConfig';

const feed = [
  {
    id: 'reel-1',
    kind: 'video' as const,
    creator: 'streamme.studio',
    initials: 'S',
    caption: 'Satu cerita, satu momen yang ingin kamu ulang lagi.',
    likes: 12800,
    location: 'Big Buck Bunny · contoh HLS',
    stream: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: 'reel-2',
    kind: 'video' as const,
    creator: 'nara.film',
    initials: 'N',
    caption: 'Potongan cerita untuk dinikmati tanpa terburu-buru.',
    likes: 8460,
    location: 'Arte TV · contoh HLS',
    stream: 'https://test-streams.mux.dev/test_001/stream.m3u8',
  },
  {
    id: 'reel-3',
    kind: 'video' as const,
    creator: 'ruangvisual',
    initials: 'R',
    caption: 'Lihat lebih dekat. Selalu ada cerita di setiap frame.',
    likes: 5230,
    location: 'Tears of Steel · contoh HLS',
    stream: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  },
  {
    id: 'reel-4',
    kind: 'video' as const,
    creator: 'ceritakita',
    initials: 'C',
    caption: 'Berhenti sebentar. Nikmati ceritanya sampai selesai.',
    likes: 5210,
    location: 'Angel One · contoh HLS',
    stream: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',
  },
];

function CompactCount({value}: {value: number}) {
  const label = value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} rb` : `${value}`;
  return <Text style={styles.actionCount}>{label}</Text>;
}

function BookmarkIcon() {
  return (
    <View style={styles.bookmarkIcon}>
      <View style={styles.bookmarkLeftPoint} />
      <View style={styles.bookmarkRightPoint} />
    </View>
  );
}

function ReelCard({
  item,
  active,
  shouldPrepare,
  height,
}: {
  item: (typeof feed)[number];
  active: boolean;
  shouldPrepare: boolean;
  height: number;
}) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [failed, setFailed] = useState(false);
  const [following, setFollowing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [detailComment, setDetailComment] = useState('');

  return (
    <View style={[styles.reel, {height}]}>
      {shouldPrepare && !failed ? (
        <Video
          source={{uri: item.stream}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          repeat
          paused={!active || paused || captionOpen}
          onLoad={() => setBuffering(false)}
          onBuffer={({isBuffering}) => setBuffering(isBuffering)}
          onError={() => {
            setBuffering(false);
            setFailed(true);
          }}
        />
      ) : (
        <View style={styles.videoPlaceholder} />
      )}

      <View pointerEvents="none" style={styles.topShade} />
      <View pointerEvents="none" style={styles.bottomShade} />

      {active && buffering && !failed && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      )}

      {failed && (
        <View style={styles.failedState}>
          <Text style={styles.failedTitle}>Video belum tersedia</Text>
          <Text style={styles.failedCopy}>Periksa koneksi lalu geser ke video berikutnya.</Text>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={paused ? 'Putar video' : 'Jeda video'}
        onPress={() => setPaused(value => !value)}
        style={styles.videoTapArea}>
        {paused && active && <Text style={styles.pauseMark}>▶</Text>}
      </Pressable>

      {!captionOpen && <View style={styles.topBar}>
        <Text style={styles.topPlus}>＋</Text>
        <View style={styles.reelsTitle}><Text style={styles.reelsTitleText}>Reels</Text><Text style={styles.reelsChevron}>⌄</Text></View>
        <View style={styles.topActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Suka video" onPress={() => setLiked(value => !value)}><Text style={[styles.topActionIcon, liked && styles.likedIcon]}>{liked ? '♥' : '♡'}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Bagikan video" onPress={() => Share.share({message: `${item.caption}\n— ${item.creator}`})} style={styles.topMessageIcon}><View style={styles.topMessageTail} /></Pressable>
        </View>
      </View>}

      <View style={styles.actionRail}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Batal suka' : 'Suka video'}
          onPress={() => setLiked(value => !value)}
          style={({pressed}) => [styles.actionButton, pressed && styles.pressed]}>
          <Text style={[styles.actionIcon, liked && styles.likedIcon]}>{liked ? '♥' : '♡'}</Text>
          <CompactCount value={item.likes + (liked ? 1 : 0)} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Komentar"
          onPress={() => setCommentsOpen(true)}
          style={({pressed}) => [styles.actionButton, pressed && styles.pressed]}>
          <View style={styles.commentBubble}><View style={styles.bubbleTail} /></View>
          <CompactCount value={340} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bagikan video"
          onPress={() => Share.share({message: `${item.caption}\n— ${item.creator}`})}
          style={({pressed}) => [styles.actionButton, pressed && styles.pressed]}>
          <Text style={styles.actionIcon}>↗</Text>
          <Text style={styles.actionCount}>Bagikan</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Hapus dari tersimpan' : 'Simpan video'} onPress={() => setSaved(value => !value)} style={styles.actionButton}>
          <BookmarkIcon />
        </Pressable>
      </View>

      <View style={styles.captionBlock}>
        <View style={styles.contentType}><View style={styles.videoTypeDot} /><Text style={styles.contentTypeText}>VIDEO STREAMING</Text></View>
        <View style={styles.creatorRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{item.initials}</Text></View>
          <Text style={styles.creatorName}>@{item.creator}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFollowing(value => !value)}
            style={({pressed}) => [styles.followButton, following && styles.followingButton, pressed && styles.pressed]}>
            <Text style={[styles.followText, following && styles.followingText]}>{following ? 'Mengikuti' : 'Ikuti +'}</Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Buka detail caption" accessibilityHint="Membuka detail video dan caption" onPress={() => setCaptionOpen(true)}>
          <Text style={styles.caption} numberOfLines={2}>{item.caption} <Text style={styles.moreCaption}>selengkapnya</Text></Text>
          <Text style={styles.location}>♫  {item.location}</Text>
        </Pressable>
      </View>

      <Modal
        visible={captionOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setCaptionOpen(false)}>
        <KeyboardAvoidingView style={styles.detailModal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable accessibilityRole="button" accessibilityLabel="Tutup detail video" onPress={() => setCaptionOpen(false)} style={styles.detailPreviewArea} />
          <View style={styles.detailSheet}>
            <View style={styles.detailHandle} />
            <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailCreatorRow}>
                <View style={styles.detailAvatar}><Text style={styles.detailAvatarText}>{item.initials}</Text></View>
                <Text style={styles.detailCreatorName}>@{item.creator}</Text>
                <Pressable accessibilityRole="button" onPress={() => setFollowing(value => !value)} style={[styles.detailFollowButton, following && styles.detailFollowed]}>
                  <Text style={[styles.detailFollowText, following && styles.detailFollowTextActive]}>{following ? 'Mengikuti' : 'Ikuti'}</Text>
                </Pressable>
              </View>
              <Text style={styles.detailCaption}>{item.caption}</Text>
              <Text style={styles.detailDescription}>Cerita singkat hari ini dari {item.creator}. Tonton sampai selesai dan bagikan momen favoritmu.</Text>
              <Text style={styles.detailMeta}>{item.location}  ·  Baru saja</Text>
              <Text style={styles.detailTranslate}>Lihat terjemahan</Text>
              <View style={styles.detailDivider} />
              <Text style={styles.detailCommentsTitle}>Komentar <Text style={styles.detailCommentsCount}>340</Text></Text>
              <Text style={styles.detailCommentLine}><Text style={styles.detailCommentUser}>@dianaputri </Text>Suka banget suasananya.</Text>
              <Text style={styles.detailCommentLine}><Text style={styles.detailCommentUser}>@aditama </Text>Videonya jernih, ceritanya dapet.</Text>
              <Text style={styles.detailCommentLine}><Text style={styles.detailCommentUser}>@nara.visual </Text>Bagian favoritku pas menjelang akhir.</Text>
            </ScrollView>
            <View style={[styles.detailInputBar, {paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 36 : 10)}]}>
              <View style={styles.detailInputAvatar}><Text style={styles.detailAvatarText}>S</Text></View>
              <TextInput
                value={detailComment}
                onChangeText={setDetailComment}
                placeholder="Tambahkan komentar..."
                placeholderTextColor="#A2A7AE"
                style={styles.detailInput}
                returnKeyType="send"
                accessibilityLabel="Tulis komentar"
              />
              <Text style={styles.detailInputAction}>{detailComment.trim() ? 'Kirim' : '☺'}</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={commentsOpen} transparent animationType="slide" onRequestClose={() => setCommentsOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setCommentsOpen(false)} />
          <View style={styles.commentsSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Komentar <Text style={styles.commentTotal}>340</Text></Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Tutup komentar" onPress={() => setCommentsOpen(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.commentName}>@dianaputri <Text style={styles.commentText}>Suka banget suasananya.</Text></Text>
            <Text style={styles.commentName}>@aditama <Text style={styles.commentText}>Videonya jernih, ceritanya dapet.</Text></Text>
            <Text style={styles.commentName}>@nara.visual <Text style={styles.commentText}>Bagian favoritku pas menjelang akhir.</Text></Text>
            <View style={styles.commentInput}><Text style={styles.commentPlaceholder}>Tulis komentar...</Text><Text style={styles.sendComment}>Kirim</Text></View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App({initialPage = 'home', startLive = false}: {initialPage?: 'home' | 'live'; startLive?: boolean}) {
  const {height: windowHeight} = useWindowDimensions();
  const [feedHeight, setFeedHeight] = useState(windowHeight);
  const [activeIndex, setActiveIndex] = useState(0);
  const showLive = initialPage === 'live';
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const listRef = useRef<FlatList<(typeof feed)[number]>>(null);
  const viewabilityConfig = useRef({itemVisiblePercentThreshold: 80}).current;
  const onViewableItemsChanged = useRef(({viewableItems}: {viewableItems: Array<{isViewable: boolean; index?: number | null}>}) => {
    const visible = viewableItems.find(item => item.isViewable && item.index !== null);
    if (visible?.index !== null && visible?.index !== undefined) setActiveIndex(visible.index);
  }).current;

  const renderItem = useCallback(({item, index}: {item: (typeof feed)[number]; index: number}) => (
    <ReelCard
      item={item}
      active={index === activeIndex}
      shouldPrepare={Math.abs(index - activeIndex) <= 1}
      height={feedHeight}
    />
  ), [activeIndex, feedHeight]);

  const joinLive = useCallback(async (role: LiveRole, sessionId?: string) => {
    setLiveError('Menyiapkan koneksi siaran…');
    try {
      if (role === 'broadcaster' && Platform.OS === 'android') {
        setLiveError('Memeriksa izin kamera dan mikrofon…');
        const requiredPermissions = [
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ];
        const currentPermissions = await Promise.all(requiredPermissions.map(permission => PermissionsAndroid.check(permission)));
        if (currentPermissions.some(granted => !granted)) {
          const results = await PermissionsAndroid.requestMultiple(requiredPermissions);
          const allowed = Object.values(results).every(result => result === PermissionsAndroid.RESULTS.GRANTED);
          if (!allowed) {
            setLiveError('Izin kamera dan mikrofon diperlukan untuk memulai siaran.');
            return;
          }
        }
      }

      setLiveError('Meminta akses ke ruang LIVE…');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      let response: Response;
      try {
        const endpoint = role === 'broadcaster'
          ? `${liveApiBase}/live/sessions`
          : `${liveApiBase}/live/sessions/${encodeURIComponent(sessionId ?? '')}/token`;
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: role === 'broadcaster' ? JSON.stringify({creatorName: 'streamme.studio'}) : undefined,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Tidak bisa masuk ke ruang siaran.');
      setLiveError(null);
      setLiveSession({id: result.id, token: result.token, role, room: result.room, creatorName: result.creatorName ?? 'Kreator Stream Me', serverUrl: result.serverUrl});
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Tidak dapat terhubung ke server Live.');
    }
  }, []);

  const swipeToLiveSession = useCallback(async (direction: 'next' | 'previous') => {
    try {
      const response = await fetch(`${liveApiBase}/live/sessions`);
      if (!response.ok) return false;
      const sessions = await response.json() as Array<{id: string}>;
      if (sessions.length < 2) return false;
      const currentIndex = sessions.findIndex(item => item.id === liveSession?.id);
      if (currentIndex < 0) return false;
      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= sessions.length) return false;
      await joinLive('viewer', sessions[nextIndex].id);
      return true;
    } catch {
      return false;
    }
  }, [joinLive, liveSession?.id]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={showLive ? styles.liveScreen : styles.screen} edges={['top']}>
          <StatusBar barStyle={liveSession ? 'light-content' : showLive ? 'dark-content' : 'light-content'} />
        {liveSession ? (
          <LiveRoomScreen session={liveSession} onClose={() => setLiveSession(null)} onSwipeSession={swipeToLiveSession} />
        ) : showLive ? (
          <LiveLobby
            onJoin={joinLive}
            joinError={liveError}
            autoJoin={startLive && Platform.OS === 'ios'}
          />
        ) : (
          <FlatList
            ref={listRef}
            onLayout={event => setFeedHeight(event.nativeEvent.layout.height)}
            data={feed}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            pagingEnabled
            decelerationRate="fast"
            snapToAlignment="start"
            showsVerticalScrollIndicator={false}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            getItemLayout={(_, index) => ({length: feedHeight, offset: feedHeight * index, index})}
            initialNumToRender={2}
            windowSize={3}
            removeClippedSubviews={false}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#111827'},
  reel: {width: '100%', overflow: 'hidden', backgroundColor: '#171D2A'},
  videoPlaceholder: { ...StyleSheet.absoluteFill, backgroundColor: '#20283A' },
  topShade: {position: 'absolute', top: 0, left: 0, right: 0, height: 170, backgroundColor: 'rgba(10,15,27,0.35)'},
  bottomShade: {position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, backgroundColor: 'rgba(10,15,27,0.58)'},
  loading: {position: 'absolute', top: '48%', left: 0, right: 0, alignItems: 'center'},
  failedState: {position: 'absolute', left: 32, right: 32, top: '43%', alignItems: 'center'},
  failedTitle: {color: '#FFFFFF', fontSize: 19, fontWeight: '800'},
  failedCopy: {color: '#E1E7F0', fontSize: 13, textAlign: 'center', marginTop: 8},
  videoTapArea: {...StyleSheet.absoluteFill},
  pauseMark: {alignSelf: 'center', marginTop: '95%', overflow: 'hidden', color: '#FFFFFF', fontSize: 30, fontWeight: '900', backgroundColor: '#131A2A99', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 40},
  topBar: {position: 'absolute', top: 6, left: 18, right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  topPlus: {color: '#FFFFFF', fontSize: 35, fontWeight: '400', lineHeight: 42, textShadowColor: '#00000099', textShadowRadius: 5},
  reelsTitle: {flexDirection: 'row', alignItems: 'center', gap: 7},
  reelsTitleText: {color: '#FFFFFF', fontSize: 20, fontWeight: '900', textShadowColor: '#00000099', textShadowRadius: 5},
  reelsChevron: {color: '#FFFFFF', fontSize: 24, marginTop: -5, textShadowColor: '#00000099', textShadowRadius: 5},
  topActions: {flexDirection: 'row', alignItems: 'center', gap: 16},
  topActionIcon: {color: '#FFFFFF', fontSize: 27, fontWeight: '700', textShadowColor: '#00000099', textShadowRadius: 5},
  topMessageIcon: {width: 21, height: 17, borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 6},
  topMessageTail: {position: 'absolute', left: 3, bottom: -4, width: 7, height: 7, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#20283A', transform: [{rotate: '-35deg'}]},
  actionRail: {position: 'absolute', right: 12, bottom: 158, alignItems: 'center', gap: 18},
  actionButton: {alignItems: 'center', justifyContent: 'center', minWidth: 48},
  actionIcon: {color: '#FFFFFF', fontSize: 32, fontWeight: '700', textShadowColor: '#00000077', textShadowRadius: 8},
  commentBubble: {width: 28, height: 22, borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 8, backgroundColor: '#141A2C44'},
  bubbleTail: {position: 'absolute', bottom: -5, left: 5, width: 8, height: 8, backgroundColor: '#141A2C', borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#FFFFFF', transform: [{rotate: '-35deg'}]},
  likedIcon: {color: '#FF7186'},
  actionCount: {color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginTop: 2, textShadowColor: '#000000AA', textShadowRadius: 5},
  disc: {width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#91F2D2', backgroundColor: '#283246', alignItems: 'center', justifyContent: 'center'},
  discLetter: {color: '#FFFFFF', fontWeight: '800'},
  bookmarkIcon: {width: 17, height: 21, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#FFFFFF', marginBottom: 2},
  bookmarkLeftPoint: {position: 'absolute', left: -1, bottom: -1, width: 11, height: 2, backgroundColor: '#FFFFFF', transform: [{rotate: '38deg'}]},
  bookmarkRightPoint: {position: 'absolute', right: -1, bottom: -1, width: 11, height: 2, backgroundColor: '#FFFFFF', transform: [{rotate: '-38deg'}]},
  captionBlock: {position: 'absolute', left: 18, right: 82, bottom: 84},
  contentType: {flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: '#12182799', marginBottom: 10},
  videoTypeDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#91F2D2'},
  contentTypeText: {color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.8},
  creatorRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  avatar: {width: 34, height: 34, borderRadius: 17, backgroundColor: '#2559F4', alignItems: 'center', justifyContent: 'center', marginRight: 9, borderWidth: 1.5, borderColor: '#FFFFFF'},
  avatarText: {color: '#FFFFFF', fontSize: 13, fontWeight: '900'},
  creatorName: {color: '#FFFFFF', fontSize: 14, fontWeight: '800', textShadowColor: '#00000099', textShadowRadius: 6},
  followButton: {marginLeft: 10, paddingHorizontal: 11, paddingVertical: 6, borderWidth: 1, borderColor: '#FFFFFFB3', borderRadius: 14, backgroundColor: '#11182755'},
  followingButton: {backgroundColor: '#FFFFFF', borderColor: '#FFFFFF'},
  followText: {color: '#FFFFFF', fontSize: 11, fontWeight: '800'},
  followingText: {color: '#192338'},
  caption: {color: '#FFFFFF', fontSize: 13, lineHeight: 19, fontWeight: '500', textShadowColor: '#000000CC', textShadowRadius: 7},
  moreCaption: {color: '#C8CBD1', fontWeight: '700'},
  location: {color: '#E5EAF2', fontSize: 11, marginTop: 9, fontWeight: '600'},
  pressed: {opacity: 0.72, transform: [{scale: 0.96}]},
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  modalBackdrop: {...StyleSheet.absoluteFill, backgroundColor: '#10182A88'},
  commentsSheet: {paddingHorizontal: 22, paddingTop: 12, paddingBottom: 34, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#F7F8FC'},
  sheetHandle: {alignSelf: 'center', width: 38, height: 4, borderRadius: 3, backgroundColor: '#CCD2DE', marginBottom: 18},
  sheetHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22},
  sheetTitle: {color: '#192338', fontSize: 18, fontWeight: '800'},
  commentTotal: {color: '#778195', fontSize: 14, fontWeight: '600'},
  closeButton: {color: '#657086', fontSize: 18, fontWeight: '700', padding: 4},
  commentName: {color: '#2559F4', fontSize: 13, fontWeight: '800', marginBottom: 18},
  commentText: {color: '#263147', fontSize: 13, fontWeight: '500'},
  commentInput: {height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 4},
  commentPlaceholder: {color: '#8993A5', fontSize: 13},
  sendComment: {color: '#2559F4', fontSize: 13, fontWeight: '800'},
  detailModal: {flex: 1, backgroundColor: 'transparent'},
  detailPreviewArea: {...StyleSheet.absoluteFill, bottom: '61%'},
  detailSheet: {position: 'absolute', left: 0, right: 0, top: '39%', bottom: 0, paddingTop: 11, backgroundColor: '#17191D', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden'},
  detailHandle: {alignSelf: 'center', width: 39, height: 4, borderRadius: 4, backgroundColor: '#8B8E94', marginBottom: 16},
  detailScroll: {flex: 1},
  detailContent: {paddingHorizontal: 22, paddingBottom: 20},
  detailCreatorRow: {minHeight: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 17},
  detailAvatar: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#263246', marginRight: 11},
  detailAvatarText: {color: '#FFFFFF', fontSize: 15, fontWeight: '900'},
  detailCreatorName: {color: '#FFFFFF', fontSize: 15, fontWeight: '800', flex: 1},
  detailFollowButton: {paddingHorizontal: 17, paddingVertical: 9, borderWidth: 1, borderColor: '#B7BBC2', borderRadius: 18},
  detailFollowed: {backgroundColor: '#FFFFFF', borderColor: '#FFFFFF'},
  detailFollowText: {color: '#FFFFFF', fontSize: 13, fontWeight: '700'},
  detailFollowTextActive: {color: '#17191D'},
  detailCaption: {color: '#FFFFFF', fontSize: 17, lineHeight: 24, fontWeight: '600', marginBottom: 12},
  detailDescription: {color: '#E7E8EA', fontSize: 15, lineHeight: 22, marginBottom: 13},
  detailMeta: {color: '#A6A9AF', fontSize: 12, marginBottom: 9},
  detailTranslate: {color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginBottom: 17},
  detailDivider: {height: StyleSheet.hairlineWidth, backgroundColor: '#383B40', marginBottom: 15},
  detailCommentsTitle: {color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 13},
  detailCommentsCount: {color: '#A6A9AF', fontWeight: '500'},
  detailCommentLine: {color: '#E7E8EA', fontSize: 14, lineHeight: 21, marginBottom: 12},
  detailCommentUser: {color: '#FFFFFF', fontWeight: '800'},
  detailInputBar: {minHeight: 65, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#383B40', backgroundColor: '#17191D'},
  detailInputAvatar: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2559F4', marginRight: 10},
  detailInput: {flex: 1, minHeight: 41, color: '#FFFFFF', fontSize: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#45484E', borderRadius: 22},
  detailInputAction: {color: '#D5DAE3', fontSize: 15, fontWeight: '800', marginLeft: 12},
  liveScreen: {flex: 1, backgroundColor: '#F7F8FC'},
});
