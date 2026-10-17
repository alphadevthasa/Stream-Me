import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FlatList, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import type {LiveRole} from './LiveRoom';
import {liveApiBase} from './liveConfig';

type LiveListing = {id: string; room: string; creatorName: string; viewers: number};

export function LiveLobby({
  onJoin,
  joinError,
  autoJoin = false,
}: {
  onJoin: (role: LiveRole, sessionId?: string) => Promise<void>;
  joinError: string | null;
  autoJoin?: boolean;
}) {
  const [sessions, setSessions] = useState<LiveListing[]>([]);
  const [serverReady, setServerReady] = useState(true);
  const [serverMessage, setServerMessage] = useState('');
  const [joining, setJoining] = useState(false);
  const autoJoined = useRef(false);

  const join = async (role: LiveRole, sessionId?: string) => {
    setJoining(true);
    try { await onJoin(role, sessionId); } finally { setJoining(false); }
  };

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${liveApiBase}/live/sessions`);
      if (!response.ok) throw new Error('Server LIVE tidak merespons.');
      const liveSessions = await response.json() as LiveListing[];
      setSessions(liveSessions);
      setServerReady(true);
      setServerMessage('');
      if (liveSessions.length > 0 && autoJoin && Platform.OS === 'ios' && !autoJoined.current) {
        autoJoined.current = true;
        onJoin('viewer', liveSessions[0].id).catch(() => undefined);
      }
    } catch (error) {
      setServerReady(false);
      setServerMessage(error instanceof Error ? error.message : 'Tidak dapat menghubungi server LIVE.');
      setSessions([]);
    }
  }, [autoJoin, onJoin]);

  useEffect(() => {
    refresh().catch(() => undefined);
    const timer = setInterval(() => refresh().catch(() => undefined), 2500);
    return () => clearInterval(timer);
  }, [refresh]);

  const canBroadcast = Platform.OS === 'android';
  const renderSession = ({item}: {item: LiveListing}) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionAvatar}><Text style={styles.sessionAvatarText}>{(item.creatorName.replace(/^@/, '')[0] || 'S').toUpperCase()}</Text><View style={styles.avatarLiveDot} /></View>
      <View style={styles.sessionInfo}>
        <Text style={styles.creatorName} numberOfLines={1}>{item.creatorName.startsWith('@') ? item.creatorName : `@${item.creatorName}`}</Text>
        <Text style={styles.viewerCount}>{item.viewers} penonton · Siaran langsung</Text>
      </View>
      <Pressable accessibilityRole="button" disabled={joining} onPress={() => join('viewer', item.id)} style={({pressed}) => [styles.watchButton, pressed && styles.pressed, joining && styles.joining]}>
        <Text style={styles.watchText}>{joining ? 'Masuk…' : 'Tonton'}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.livePage}>
      <View style={styles.livePageHeader}>
        <Text style={styles.livePageWordmark}>stream<Text style={styles.livePageWordmarkAccent}>me</Text></Text>
        <View style={styles.headerLiveBadge}><View style={styles.pageLiveDot} /><Text style={styles.pageLiveText}>LIVE</Text></View>
      </View>

      <View style={styles.headingRow}>
        <View><Text style={styles.pageTitle}>Siaran langsung</Text><Text style={styles.pageSubtitle}>Temukan kreator yang sedang live</Text></View>
        <View style={styles.liveCountBadge}><View style={styles.pageLiveDot} /><Text style={styles.liveCountText}>{sessions.length} LIVE</Text></View>
      </View>

      {sessions.length > 0 ? (
        <FlatList data={sessions} keyExtractor={item => item.id} renderItem={renderSession} contentContainerStyle={styles.sessionList} showsVerticalScrollIndicator={false} />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><View style={styles.emptyDot} /></View>
          <Text style={styles.emptyTitle}>Belum ada yang live</Text>
          <Text style={styles.emptyCopy}>{canBroadcast ? 'Mulai siaranmu. Penonton di perangkat lain bisa menemukannya di daftar ini.' : 'Siaran kreator akan muncul di sini saat mereka mulai live.'}</Text>
        </View>
      )}

      {canBroadcast && <Pressable accessibilityRole="button" disabled={joining} onPress={() => join('broadcaster')} style={({pressed}) => [styles.startButton, pressed && styles.pressed, joining && styles.joining]}>
        <Text style={styles.startIcon}>＋</Text><Text style={styles.startButtonText}>{joining ? 'Menyiapkan siaran…' : 'Mulai siaran langsung'}</Text>
      </Pressable>}
      {!serverReady && <Text style={styles.serverHint}>Server LIVE belum tersambung. {serverMessage}</Text>}
      {joinError && <Text style={styles.serverHint}>{joinError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  livePage: {flex: 1, paddingHorizontal: 22},
  livePageHeader: {height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  livePageWordmark: {color: '#192338', fontSize: 20, fontWeight: '900', letterSpacing: -0.9},
  livePageWordmarkAccent: {color: '#2559F4'},
  headerLiveBadge: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: '#FFE8E8'},
  pageLiveDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: '#F04452'},
  pageLiveText: {color: '#D92D3A', fontSize: 11, fontWeight: '900', letterSpacing: 0.4},
  headingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 17},
  pageTitle: {color: '#192338', fontSize: 22, fontWeight: '900', letterSpacing: -0.5},
  pageSubtitle: {color: '#7A8497', fontSize: 12, marginTop: 5},
  liveCountBadge: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, backgroundColor: '#FFE8E8'},
  liveCountText: {color: '#D92D3A', fontSize: 10, fontWeight: '900'},
  sessionList: {paddingBottom: 16},
  sessionCard: {minHeight: 78, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, backgroundColor: '#FFFFFF', marginBottom: 11, borderWidth: 1, borderColor: '#EDF0F6'},
  sessionAvatar: {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7EDFF', marginRight: 12},
  sessionAvatarText: {color: '#2559F4', fontSize: 18, fontWeight: '900'},
  avatarLiveDot: {position: 'absolute', right: -1, bottom: -1, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#F04452'},
  sessionInfo: {flex: 1},
  creatorName: {color: '#192338', fontSize: 14, fontWeight: '800'},
  viewerCount: {color: '#7A8497', fontSize: 11, marginTop: 5},
  watchButton: {paddingHorizontal: 15, paddingVertical: 9, borderRadius: 14, backgroundColor: '#2559F4'},
  watchText: {color: '#FFFFFF', fontSize: 12, fontWeight: '800'},
  emptyState: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingBottom: 66},
  emptyIcon: {width: 78, height: 78, borderRadius: 39, backgroundColor: '#FFE8E8', alignItems: 'center', justifyContent: 'center', marginBottom: 19},
  emptyDot: {width: 23, height: 23, borderRadius: 12, backgroundColor: '#F04452'},
  emptyTitle: {color: '#192338', fontSize: 20, fontWeight: '900', textAlign: 'center'},
  emptyCopy: {color: '#6B7588', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, maxWidth: 300},
  startButton: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14, paddingVertical: 15, borderRadius: 16, backgroundColor: '#2559F4'},
  startIcon: {color: '#FFFFFF', fontSize: 21, fontWeight: '600', lineHeight: 21},
  startButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '800'},
  serverHint: {color: '#B5474C', fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 10},
  pressed: {opacity: 0.72, transform: [{scale: 0.98}]},
  joining: {opacity: 0.82},
});
