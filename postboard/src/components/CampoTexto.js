import React, { forwardRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
} from 'react-native';

const CampoTexto = forwardRef((props, ref) => {
    const {
        label,
        valor,
        onMudar,
        onSairFoco,
        erro,
        obrigatorio,
        proximoCampo,
        ultimoCampo,
        ...rest
    } = props;

    const temErro = !!erro;

    return (
        <View style={styles.container}>
            <Text>{label}</Text>

            <TextInput
                ref={ref} // ✅ AGORA FUNCIONA
                style={[
                    styles.input,
                    temErro && styles.erro,
                ]}
                value={valor}
                onChangeText={onMudar}
                onBlur={onSairFoco}
                returnKeyType={ultimoCampo ? 'done' : 'next'}
                onSubmitEditing={() => {
                    if (proximoCampo?.current) {
                        proximoCampo.current.focus();
                    }
                }}
                {...rest}
            />

            {temErro && <Text>{erro}</Text>}
        </View>
    );
});

export default CampoTexto;

const styles = StyleSheet.create({
    container: { marginBottom: 20 },
    input: { borderWidth: 1, padding: 10 },
    erro: { borderColor: 'red' },
});