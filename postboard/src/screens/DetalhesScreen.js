import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getUsuarioPorId } from '../services/api';
import { salvar, ler, lerMesmoExpirado, CHAVES } from '../storage/cache';
import LoadingIndicator from '../components/LoadingIndicator';

export default function DetalhesScreen({ navigation, route }) {
  const { post: postParam } = route.params;

  const [post, setPost] = useState(postParam);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletando, setDeletando] = useState(false);
  const [erroAutor, setErroAutor] = useState(null);
  const [fonteOffline, setFonteOffline] = useState(false); // true se cache expirado

  useLayoutEffect(() => {
    navigation.setOptions({ title: `Post #${post.id}` });
  }, [navigation, post.id]);

  useEffect(() => {
    async function carregarDados() {
      try {
        // ─── Cache do post individual ─────────────────────────
        const chavePost = CHAVES.POST(postParam.id);
        const cachePost = await ler(chavePost);

        if (cachePost) {
          setPost(cachePost);
          setFonteOffline(false);
        } else {
          // fallback do route.params.post
          setPost(postParam);
          setFonteOffline(true);
        }

        // ─── Cache do autor ─────────────────────────────────
        const chaveUsuario = CHAVES.USUARIO(postParam.userId);
        const cacheUsuario = await ler(chaveUsuario);

        if (cacheUsuario) {
          setUsuario(cacheUsuario);
        } else {
          // Busca na API e salva no cache
          const dadosUsuario = await getUsuarioPorId(postParam.userId);
          setUsuario(dadosUsuario);
          await salvar(chaveUsuario, dadosUsuario);
        }

        // ─── Salva o post no cache para próximas vezes ──────
        await salvar(chavePost, postParam);

      } catch (e) {
        console.warn('Erro ao carregar detalhes:', e.message);

        // Tenta cache expirado antes de desistir
        const chaveUsuario = CHAVES.USUARIO(postParam.userId);
        const cacheAntigoUsuario = await lerMesmoExpirado(chaveUsuario);
        if (cacheAntigoUsuario) setUsuario(cacheAntigoUsuario);

        const chavePost = CHAVES.POST(postParam.id);
        const cacheAntigoPost = await lerMesmoExpirado(chavePost);
        if (cacheAntigoPost) setPost(cacheAntigoPost);

        setFonteOffline(true);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [postParam]);

  function confirmarDelecao() {
    Alert.alert(
      'Excluir post',
      `Deseja excluir o post "${post.title.substring(0, 40)}..."?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: executarDelecao },
      ]
    );
  }

  async function executarDelecao() {
    try {
      setDeletando(true);
      // Se você tiver deletarPost na API, chame aqui
      // await deletarPost(post.id);
      Alert.alert('Sucesso', 'Post excluído com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível excluir o post.');
    } finally {
      setDeletando(false);
    }
  }

  if (loading) return <LoadingIndicator mensagem="Carregando detalhes..." />;

  return (
    <ScrollView style={styles.container}>
      {fonteOffline && (
        <View style={styles.bannerOffline}>
          <Text style={styles.bannerTexto}>
            📡 Sem internet — exibindo dados do cache
          </Text>
        </View>
      )}

      {erroAutor && (
        <View style={styles.erro}>
          <Text style={styles.erroTexto}>{erroAutor}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.titulo}>{post.title}</Text>
        <Text style={styles.corpo}>{post.body}</Text>
      </View>

      {usuario && (
        <View style={styles.autorCard}>
          <Text style={styles.autorLabel}>Autor</Text>
          <Text style={styles.autorNome}>{usuario.name}</Text>
          <Text style={styles.autorInfo}>✉️ {usuario.email}</Text>
          <Text style={styles.autorInfo}>🌐 {usuario.website}</Text>
          <Text style={styles.autorInfo}>🏢 {usuario.company.name}</Text>
        </View>
      )}

      <View style={styles.acoes}>
        <TouchableOpacity
          style={styles.botaoEditar}
          onPress={() => navigation.navigate('FormularioTab', { post })}
        >
          <Text style={styles.textoBotao}>✏️ Editar post</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botaoExcluir, deletando && styles.botaoDesabilitado]}
          onPress={confirmarDelecao}
          disabled={deletando}
        >
          <Text style={styles.textoBotao}>
            {deletando ? 'Excluindo...' : '🗑️ Excluir post'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },

  bannerOffline: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  bannerTexto: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },

  erro: {
    backgroundColor: '#fde047',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },

  erroTexto: {
    color: '#92400e',
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },

  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e3a5f',
    textTransform: 'capitalize',
    marginBottom: 16,
    lineHeight: 28,
  },

  corpo: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },

  autorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1a56db',
  },

  autorLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },

  autorNome: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 8,
  },

  autorInfo: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },

  acoes: {
    gap: 12,
  },

  botaoEditar: {
    backgroundColor: '#1a56db',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },

  botaoExcluir: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  textoBotao: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});