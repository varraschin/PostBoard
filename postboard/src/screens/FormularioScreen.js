import React, {
  useRef,
  useLayoutEffect,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { criarPost, atualizarPost } from '../services/api';
import { remover, CHAVES } from '../storage/cache';
import useFormulario, { REGRAS } from '../hooks/useFormulario';
import CampoTexto from '../components/CampoTexto';
import SeletorAutor from '../components/SeletorAutor';

const CAMPOS_INICIAIS = {
  titulo: '',
  corpo: '',
  autorId: null,
};

const REGRAS_VALIDACAO = {
  titulo: [
    REGRAS.obrigatorio,
    REGRAS.semEspacoInicial,
    REGRAS.semCaracteresEspeciais, // ✅ EX 1
    REGRAS.minimo(5),
    REGRAS.maximo(100),
  ],
  corpo: [
    REGRAS.obrigatorio,
    REGRAS.minimo(10),
    REGRAS.minimosPalavras(3), // ✅ EX 3
    REGRAS.maximo(500),
  ],
  autorId: [
    (valor) => (!valor ? 'Selecione um autor.' : null),
  ],
};

export default function FormularioScreen({
  navigation,
  route,
}) {
  const postParaEditar = route?.params?.post || null;
  const modoEdicao = !!postParaEditar;

  const form = useFormulario(
    CAMPOS_INICIAIS,
    REGRAS_VALIDACAO
  );

  const refCorpo = useRef(null);

  // ✅ EX 4
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (modoEdicao) {
      form.preencher({
        titulo: postParaEditar.title,
        corpo: postParaEditar.body,
        autorId: postParaEditar.userId,
      });
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: modoEdicao
        ? `Editar Post #${postParaEditar.id}`
        : 'Novo Post',
    });
  }, [navigation, modoEdicao]);

  async function handleSubmit() {
    const valido = form.validarTudo();

    if (!valido) {
      Alert.alert(
        'Formulário inválido',
        'Corrija os campos destacados.'
      );
      return;
    }

    try {
      setEnviando(true); // ✅

      const payload = {
        title: form.valores.titulo.trim(),
        body: form.valores.corpo.trim(),
        userId: form.valores.autorId,
      };

      if (modoEdicao) {
        await atualizarPost(postParaEditar.id, payload);
      } else {
        await criarPost(payload);
      }

      await remover(CHAVES.POSTS);

      Alert.alert('Sucesso!', 'Salvo com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            form.resetar();
            navigation.goBack();
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setEnviando(false); // ✅
    }
  }

  // ✅ EX 2 (contador de palavras)
  const palavras = form.valores.corpo
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === 'ios' ? 'padding' : 'height'
      }
    >
      <ScrollView style={styles.scroll}>
        <View style={styles.conteudo}>
          <CampoTexto
            label="Título"
            obrigatorio
            valor={form.valores.titulo}
            onMudar={(v) => form.definir('titulo', v)}
            onSairFoco={() => form.tocar('titulo')}
            erro={form.erros.titulo}
            proximoCampo={refCorpo}
          />

          <CampoTexto
            ref={refCorpo}
            label="Conteúdo"
            obrigatorio
            valor={form.valores.corpo}
            onMudar={(v) => form.definir('corpo', v)}
            onSairFoco={() => form.tocar('corpo')}
            erro={form.erros.corpo}
            multiline
          />

          {/* ✅ CONTADOR DE PALAVRAS */}
          <Text style={styles.contador}>
            {palavras} palavras
          </Text>

          <SeletorAutor
            autorId={form.valores.autorId}
            onSelecionar={(u) => {
              form.definir('autorId', u.id);
              form.tocar('autorId');
            }}
            erro={form.erros.autorId}
          />

          <TouchableOpacity
            disabled={enviando}
            style={styles.botao}
            onPress={handleSubmit}
          >
            {enviando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.texto}>
                Salvar
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={enviando}
            onPress={() => navigation.goBack()}
          >
            <Text>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  conteudo: { padding: 20 },
  contador: { marginBottom: 10, color: '#6b7280' },
  botao: {
    backgroundColor: '#1a56db',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
  },
  texto: { color: '#fff' },
});