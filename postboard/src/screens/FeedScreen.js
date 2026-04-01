import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Text } from 'react-native';
import { getPosts, getPostsPorUsuario } from '../services/api';
import PostCard from '../components/PostCard';
import LoadingIndicator from '../components/LoadingIndicator';
import EmptyState from '../components/EmptyState';

export default function FeedScreen({ navigation }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [maisCarregando, setMaisCarregando] = useState(false);

    // Botão '+' no header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate('FormularioTab')}
                    style={{ marginRight: 4, padding: 4 }}
                >
                    <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>+</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    // Carrega posts ao montar a tela
    useEffect(() => {
        carregarPosts();
    }, []);

    // ── Busca posts da API ───────────────────────────────
    async function carregarPosts(paginaAtual = 1) {
        try {
            paginaAtual === 1 ? setLoading(true) : setMaisCarregando(true);
            setErro(null);
            const dados = await getPosts(`?_page=${paginaAtual}&_limit=10`);
            if (paginaAtual === 1) setPosts(dados);
            else setPosts(prev => [...prev, ...dados]);
            navigation.setOptions({ title: `PostBoard (${paginaAtual === 1 ? dados.length : posts.length + dados.length})` });
        } catch (e) {
            setErro('Não foi possível carregar os posts.\nVerifique sua conexão.');
        } finally {
            setLoading(false);
            setMaisCarregando(false);
        }
    }

    // ── Pull-to-refresh ────────────────────────────────
    async function onRefresh() {
        setRefreshing(true);
        setPagina(1);
        await carregarPosts(1);
        setRefreshing(false);
    }

    // ── Tela de loading inicial ─────────────────────────
    if (loading) return <LoadingIndicator mensagem="Carregando posts..." />;

    // ── Tela de erro ──────────────────────────────────
    if (erro && posts.length === 0) {
        return (
            <EmptyState
                icone="⚠️"
                titulo="Ops! Algo deu errado"
                mensagem={erro}
                textoBotao="Tentar novamente"
                onBotao={() => carregarPosts()}
            />
        );
    }

    // ── Lista de posts ─────────────────────────────────
    return (
        <View style={styles.container}>
            <FlatList
                data={posts}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onPress={() => navigation.navigate('Detalhes', { post: item })}
                    />
                )}
                ListEmptyComponent={
                    <EmptyState
                        icone="📭"
                        titulo="Nenhum post encontrado"
                        mensagem="A lista está vazia no momento."
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
                contentContainerStyle={posts.length === 0 ? styles.listaVazia : styles.lista}
                ItemSeparatorComponent={() => <View style={styles.separador} />}
                ListFooterComponent={() => posts.length > 0 && (
                    <TouchableOpacity
                        style={styles.botaoCarregarMais}
                        onPress={() => {
                            const novaPagina = pagina + 1;
                            setPagina(novaPagina);
                            carregarPosts(novaPagina);
                        }}
                        disabled={maisCarregando}
                    >
                        <Text style={styles.textoBotao}>
                            {maisCarregando ? 'Carregando...' : 'Carregar mais'}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  lista: {
    padding: 16,
    paddingBottom: 32,
  },
  listaVazia: {
    flex: 1,
    justifyContent: 'center',
  },
  separador: {
    height: 12,
  },
  botaoCarregarMais: {
    backgroundColor: '#1a56db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  textoBotao: {
    color: '#ffffff',
    fontWeight: '700',
  },
});