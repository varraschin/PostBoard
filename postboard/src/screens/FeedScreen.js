import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import { getPosts } from '../services/api';
import {
  salvar,
  ler,
  lerMesmoExpirado,
  CHAVES,
} from '../storage/cache';

import PostCard from '../components/PostCard';
import LoadingIndicator from '../components/LoadingIndicator';
import EmptyState from '../components/EmptyState';

export default function FeedScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // fonteOffline: true quando estamos exibindo dados do cache expirado
  const [fonteOffline, setFonteOffline] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('FormularioTab')}
          style={{ marginRight: 4, padding: 4 }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 28,
              fontWeight: '300',
            }}
          >
            +
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    carregarPosts();
  }, []);

  // ── Estratégia cache-first ────────────────────────────
  async function carregarPosts() {
    try {
      setLoading(true);
      setErro(null);

      // 1. Tenta cache válido (não expirado)
      const cacheValido = await ler(CHAVES.POSTS);

      if (cacheValido) {
        setPosts(cacheValido);
        setFonteOffline(false);
        setLoading(false);
        return;
      }

      // 2. Cache vazio ou expirado — busca na API
      const dados = await getPosts();

      setPosts(dados);
      await salvar(CHAVES.POSTS, dados);
      setFonteOffline(false);
    } catch (e) {
      // 3. API falhou — tenta cache antigo (mesmo expirado)
      const cacheAntigo = await lerMesmoExpirado(CHAVES.POSTS);

      if (cacheAntigo) {
        setPosts(cacheAntigo);
        setFonteOffline(true);
      } else {
        setErro(
          'Sem conexão e sem dados em cache.\nVerifique sua internet.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Pull-to-refresh: força atualização da API ─────────
  async function onRefresh() {
    try {
      setRefreshing(true);
      setErro(null);

      // Ao puxar para atualizar, ignora cache e vai direto à API
      const dados = await getPosts();

      setPosts(dados);
      await salvar(CHAVES.POSTS, dados);
      setFonteOffline(false);
    } catch (e) {
      setErro(
        'Não foi possível atualizar. Verifique sua conexão.'
      );
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return <LoadingIndicator mensagem="Carregando posts..." />;
  }

  if (erro && posts.length === 0) {
    return (
      <EmptyState
        icone="⚠️"
        titulo="Ops! Algo deu errado"
        mensagem={erro}
        textoBotao="Tentar novamente"
        onBotao={carregarPosts}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Banner de aviso quando os dados vêm do cache offline */}
      {fonteOffline && (
        <View style={styles.bannerOffline}>
          <Text style={styles.bannerTexto}>
            📡 Sem internet — exibindo dados salvos anteriormente
          </Text>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() =>
              navigation.navigate('Detalhes', { post: item })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icone="📭"
            titulo="Nenhum post encontrado"
            mensagem="A lista está vazia."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a56db']}
            tintColor="#1a56db"
          />
        }
        contentContainerStyle={
          posts.length === 0
            ? styles.listaVazia
            : styles.lista
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: 12 }} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  lista: {
    padding: 16,
    paddingBottom: 32,
  },

  listaVazia: {
    flex: 1,
    justifyContent: 'center',
  },

  bannerOffline: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  bannerTexto: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },
});