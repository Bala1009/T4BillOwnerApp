import { Feather } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card, ScreenWrapper } from "../components";
import { hp, ms, useTheme, wp } from "../theme";

export interface ProductDetailData {
    id: string;
    name: string;
    price: number;
    value: number;
    salesCount: number;
}

type RootStackParamList = {
    ProductDetail: { product: ProductDetailData };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen({ route, navigation }: Props) {
    const { product } = route.params;
    const { colors } = useTheme();

    return (
        <ScreenWrapper>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={ms(24)} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Item Details</Text>
                <View style={{ width: ms(24) }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Product Cover/Icon Card */}
                <Card style={styles.topCard}>
                    <View style={[styles.iconWrap, { backgroundColor: colors.blueBg }]}>
                        <Feather name="shopping-bag" size={ms(40)} color={colors.primary} />
                    </View>
                    <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: colors.greenBg }]}>
                        <Text style={[styles.statusText, { color: colors.green }]}>Sold: {product.salesCount}</Text>
                    </View>
                </Card>

                {/* Info Grid */}
                <View style={styles.gridContainer}>
                    {/* Price & Value */}
                    <Card style={[styles.gridItem, { marginRight: wp(2) }]}>
                        <View style={[styles.gridIconWrap, { backgroundColor: colors.primary + '20' }]}>
                            <Feather name="tag" size={ms(20)} color={colors.primary} />
                        </View>
                        <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Estimated Price</Text>
                        <Text style={[styles.gridValue, { color: colors.textPrimary }]}>₹{product.price.toLocaleString()}</Text>
                    </Card>
                    <Card style={[styles.gridItem, { marginLeft: wp(2) }]}>
                        <View style={[styles.gridIconWrap, { backgroundColor: colors.orange + '20' }]}>
                            <Feather name="dollar-sign" size={ms(20)} color={colors.orange} />
                        </View>
                        <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Revenue Generated</Text>
                        <Text style={[styles.gridValue, { color: colors.textPrimary }]}>₹{product.value.toLocaleString()}</Text>
                    </Card>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(16),
        paddingVertical: hp(12),
    },
    backButton: {
        padding: ms(4),
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: ms(18),
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingTop: hp(16),
        paddingHorizontal: wp(16),
        paddingBottom: hp(40),
    },
    topCard: {
        alignItems: 'center',
        paddingVertical: hp(24),
    },
    iconWrap: {
        width: ms(80),
        height: ms(80),
        borderRadius: ms(40),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(16),
    },
    productName: {
        fontSize: ms(22),
        fontWeight: 'bold',
        marginBottom: hp(16),
        textAlign: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(12),
        paddingVertical: hp(6),
        borderRadius: ms(16),
    },
    statusText: {
        fontSize: ms(12),
        fontWeight: '600',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: hp(24),
    },
    gridItem: {
        flex: 1,
        minWidth: '45%',
        padding: ms(16),
    },
    gridIconWrap: {
        width: ms(40),
        height: ms(40),
        borderRadius: ms(20),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(12),
    },
    gridLabel: {
        fontSize: ms(12),
        marginBottom: hp(4),
    },
    gridValue: {
        fontSize: ms(18),
        fontWeight: 'bold',
    },
});
