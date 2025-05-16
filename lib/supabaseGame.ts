import { supabase } from './supabaseClient';

// Create a new game session
export async function createGame() {
  const { data, error } = await supabase
    .from('games')
    .insert({})
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Join a game as a player
export async function joinGame(gameId: string, playerName: string) {
  console.log('Joining game:', gameId, playerName);
  const { data, error } = await supabase
    .from('players')
    .insert({ game_id: gameId, name: playerName })
    .select()
    .single();
  if (error) {
    console.error('Supabase joinGame error:', error);
    throw error;
  }
  console.log('Player joined:', data);
  return data;
}

// Place a bid for a player and reset the bidding timer
export async function placeBid(gameId: string, playerId: string, listingId: string, amount: number) {
  // Place the bid (no balance deduction here)
  const { data, error } = await supabase
    .from('bids')
    .insert({ game_id: gameId, player_id: playerId, listing_id: listingId, amount })
    .select()
    .single();
  if (error) throw error;

  // Fetch current bidding_end_time
  const { data: game } = await supabase
    .from('games')
    .select('bidding_end_time')
    .eq('id', gameId)
    .single();
  const now = Date.now();
  const newEndTime = new Date(now + 8000).toISOString();
  let shouldUpdate = true;
  if (game?.bidding_end_time) {
    const currentEnd = new Date(game.bidding_end_time).getTime();
    // Only update if the new end time is later than the current one
    shouldUpdate = now + 8000 > currentEnd;
  }
  if (shouldUpdate) {
    await supabase
      .from('games')
      .update({ bidding_end_time: newEndTime })
      .eq('id', gameId);
  }
  return data;
}

// Subscribe to real-time player changes in a game
export function subscribeToPlayers(gameId: string, callback: (players: any[]) => void) {
  return supabase
    .channel('players')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` },
      async () => {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId);
        callback(data || []);
      }
    )
    .subscribe();
}

// Subscribe to real-time bid changes in a game
export function subscribeToBids(gameId: string, callback: (bids: any[]) => void) {
  return supabase
    .channel('bids')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bids', filter: `game_id=eq.${gameId}` },
      async (payload) => {
        const { data } = await supabase
          .from('bids')
          .select('*')
          .eq('game_id', gameId)
          .order('created_at', { ascending: false });
        console.log('[Realtime] Bids updated:', data, 'Event:', payload.eventType, payload.new || payload.old);
        callback([...(data || [])]);
      }
    )
    .subscribe();
}

// Add a new listing to Supabase
export async function addListingToSupabase({ title, images, area, size, rooms, realPrice }: {
  title: string,
  images: string[],
  area: string,
  size: string,
  rooms: string,
  realPrice: number,
}) {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      title,
      images,
      area,
      size,
      rooms,
      real_price: realPrice,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Upload an image file to Supabase Storage and return the public URL
export async function uploadListingImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `${fileName}`;
  const { data, error } = await supabase.storage.from('listing-images').upload(filePath, file);
  if (error) throw error;
  // Get public URL
  const { data: publicUrlData } = supabase.storage.from('listing-images').getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}

// Fetch N random listing IDs from Supabase (robust JS shuffle)
export async function fetchRandomListings(n: number) {
  const { data, error } = await supabase
    .from('listings')
    .select('id');
  if (error) throw error;
  if (!data || data.length < n) {
    throw new Error(`Not enough listings in the database. Needed: ${n}, found: ${data ? data.length : 0}`);
  }
  // Shuffle and pick n
  const shuffled = data.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, n).map((l: any) => l.id);
  console.log('Randomly selected listing IDs for this game:', selected);
  return selected;
}

// Update a game with selected listing IDs
export async function setGameListings(gameId: string, listingIds: string[]) {
  const { error } = await supabase
    .from('games')
    .update({ listing_ids: listingIds })
    .eq('id', gameId);
  if (error) throw error;
}

// Set a player's ready status
export async function setPlayerReady(playerId: string, ready: boolean) {
  const { error } = await supabase
    .from('players')
    .update({ ready })
    .eq('id', playerId);
  if (error) throw error;
}

// Get the current listing index for a game
export async function getCurrentListingIndex(gameId: string): Promise<number> {
  const { data, error } = await supabase
    .from('games')
    .select('current_listing_index')
    .eq('id', gameId)
    .single();
  if (error) throw error;
  return data?.current_listing_index ?? 0;
}

// Increment the current listing index for a game
export async function incrementCurrentListingIndex(gameId: string) {
  const { data, error } = await supabase.rpc('increment_listing_index', { game_id: gameId });
  if (error) throw error;
  return data;
}

// Update a player's balance
export async function updatePlayerBalance(playerId: string, amount: number) {
  const { error } = await supabase
    .from('players')
    .update({ balance: amount })
    .eq('id', playerId);
  if (error) throw error;
}

// Reset the bidding_end_time in the games table for a given gameId
export async function resetBiddingEndTime(gameId: string, seconds: number = 8) {
  const newEndTime = new Date(Date.now() + seconds * 1000).toISOString();
  await supabase
    .from('games')
    .update({ bidding_end_time: newEndTime })
    .eq('id', gameId);
} 