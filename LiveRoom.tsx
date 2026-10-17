import React, {useEffect, useMemo, useRef, useState} from 'react';
import {PanResponder, Pressable, StyleSheet, Text, View} from 'react-native';
import {
  isTrackReference,
  LiveKitRoom,
  useTracks,
  VideoTrack,
} from '@livekit/react-native';
import {Track} from 'livekit-client';

export type LiveRole = 'broadcaster' | 'viewer';

export type LiveSession = {
  id: string;
  token: string;
  role: LiveRole;
  room: string;
  creatorName: string;
  serverUrl: string;
};

export function LiveRoomScreen({
  session,
  onClose,
  onSwipeSession,
}: {
  session: LiveSession;
  onClose: () => void;
  onSwipeSession: (direction: 'next' | 'previous') => Promise<boolean>;
}) {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [swipeHint, setSwipeHint] = useState('Geser ke atas atau bawah untuk melihat kreator lain');
  const changingSession = useRef(false);

  useEffect(() => {
    setConnected(false);
    setConnectionError(null);
    setSwipeHint('Geser ke atas atau bawah untuk melihat kreator lain');
  }, [session.id]);

  const swipeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_event, gesture) =>
      session.role === 'viewer' && Math.abs(gesture.dy) > 18 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.15,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
    onPanResponderRelease: (_event, gesture) => {
      if (Math.abs(gesture.dy) < 70 || changingSession.current) return;
      changingSession.current = true;
      onSwipeSession(gesture.dy < 0 ? 'next' : 'previous')
        .then(changed => { if (!changed) setSwipeHint('Tidak ada siaran lain ke arah itu'); })
        .catch(() => setSwipeHint('Tidak bisa memuat siaran berikutnya'))
        .finally(() => { changingSession.current = false; });
    },
    onPanResponderTerminate: () => { changingSession.current = false; },
  }), [onSwipeSession, session.role]);

  return (
    <View
      {...swipeResponder.panHandlers}
      style={styles.roomScreen}
    >
      <LiveKitRoom
        key={session.id}
        serverUrl={session.serverUrl}
        token={session.token}
        connect
        audio={session.role === 'broadcaster'}
        video={session.role === 'broadcaster'}
        options={{adaptiveStream: true, dynacast: true}}
        onConnected={() => {
          setConnectionError(null);
          setConnected(true);
        }}
        onDisconnected={() => setConnected(false)}
        onError={error => setConnectionError(error.message)}>
        <RoomVideo />
      </LiveKitRoom>

      <View pointerEvents="box-none" style={styles.roomOverlay}>
        <View style={styles.roomTopBar}>
          <View style={styles.roomLiveBadge}>
            <View style={styles.roomLiveDot} />
            <Text style={styles.roomLiveText}>{session.role === 'broadcaster' ? 'ANDA LIVE' : 'LIVE'}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Tutup siaran" accessibilityHint="Kembali ke daftar siaran langsung" onPress={onClose} style={styles.roomClose}>
            <Text style={styles.roomCloseText}>{session.role === 'broadcaster' ? 'Akhiri' : 'Tutup'}</Text>
          </Pressable>
        </View>

        <View style={styles.roomBottom}>
          <Text style={styles.roomCreator}>{session.creatorName.startsWith('@') ? session.creatorName : `@${session.creatorName}`}</Text>
          <Text style={styles.roomTitle}>{session.role === 'broadcaster' ? 'Siaran kamu sedang berlangsung' : 'Sedang siaran langsung'}</Text>
          {session.role === 'viewer' && <Text style={styles.roomSwipeHint}>{swipeHint}</Text>}
          {!connected && !connectionError && <Text style={styles.roomStatus}>Menghubungkan ke ruang siaran...</Text>}
          {connectionError && <Text style={styles.roomError}>{connectionError}</Text>}
        </View>
      </View>
    </View>
  );
}

function RoomVideo() {
  const tracks = useTracks([Track.Source.Camera]);
  const cameraTrack = tracks.find(track => isTrackReference(track));

  if (!cameraTrack || !isTrackReference(cameraTrack)) {
    return (
      <View style={styles.videoWaiting}>
        <View style={styles.videoWaitingMark}><Text style={styles.videoWaitingLetter}>S</Text></View>
        <Text style={styles.videoWaitingText}>Menunggu kamera siaran...</Text>
      </View>
    );
  }

  return <VideoTrack trackRef={cameraTrack} style={StyleSheet.absoluteFill} objectFit="cover" />;
}

const styles = StyleSheet.create({
  roomScreen: {flex: 1, backgroundColor: '#080B12'},
  videoWaiting: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827'},
  videoWaitingMark: {width: 64, height: 64, borderRadius: 32, backgroundColor: '#263246', alignItems: 'center', justifyContent: 'center', marginBottom: 14},
  videoWaitingLetter: {color: '#91F2D2', fontSize: 25, fontWeight: '900'},
  videoWaitingText: {color: '#E7ECF5', fontSize: 14, fontWeight: '700'},
  roomOverlay: {...StyleSheet.absoluteFill, justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 30},
  roomTopBar: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  roomLiveBadge: {flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#E94153'},
  roomLiveDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF'},
  roomLiveText: {color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.8},
  roomClose: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 17, paddingVertical: 9, borderRadius: 22, backgroundColor: '#121827E8'},
  roomCloseText: {color: '#FFFFFF', fontSize: 12, fontWeight: '800'},
  roomBottom: {padding: 16, borderRadius: 20, backgroundColor: '#121827CC'},
  roomCreator: {color: '#FFFFFF', fontSize: 14, fontWeight: '900'},
  roomTitle: {color: '#E4E9F2', fontSize: 13, marginTop: 5},
  roomSwipeHint: {color: '#B8C2D4', fontSize: 11, marginTop: 7},
  roomStatus: {color: '#91F2D2', fontSize: 12, marginTop: 10, fontWeight: '700'},
  roomError: {color: '#FF9BA5', fontSize: 12, marginTop: 10, fontWeight: '700'},
});
