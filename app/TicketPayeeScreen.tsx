import { getArticlesByCategory } from "@/services/articleService";
import { FactureService } from "@/services/FactureService";
import { TicketSoldOutService } from "@/services/TicketSoldOutService";
import { Facture } from "@/type/type";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Header from "./components/header";

const PAGE_SIZE = 5;

type TicketStatus = "payée" | "en attente" | "annulée" | "inconnu";

const TicketPayeeScreen = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [searchText, setSearchText] = useState("");
  const { colors } = useTheme();

  // 🔹 Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, ticketRes, factureRes] = await Promise.all([
          getArticlesByCategory("Événements"),
          TicketSoldOutService.getAll(),
          FactureService.getAllFactures(),
        ]);
        setEvents(eventRes || []);
        setTickets(ticketRes || []);
        setFactures(factureRes || []);
      } catch (error) {
        console.error("❌ Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔹 Lookup facture by any possible key
  const getFactureById = (factureId: string) => {
    if (!factureId) return undefined;
    return factures.find(
      (f) =>
        f.id === factureId ||
        f.factureNumber === factureId
    );
  };

  // 🔹 Tickets for an event
  const getTicketsForEvent = (posteId: string) =>
    tickets.filter((t) => t.posteId === posteId);

  // 🔹 Global totals for all factures
  const globalTotals = factures.reduce(
    (acc, f) => {
      const etat = (f.etat || "inconnu") as TicketStatus;
      acc[etat] = (acc[etat] || 0) + 1;
      return acc;
    },
    { payée: 0, "en attente": 0, annulée: 0, inconnu: 0 } as Record<
      TicketStatus,
      number
    >
  );

  // 🔹 Filter events by search
  const filteredEvents = events.filter((event) =>
    event.title?.toLowerCase().includes(searchText.toLowerCase())
  );

  // 🔹 Pagination
  const loadMore = () => {
    if (visibleCount < filteredEvents.length) {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    }
  };

  // 🔹 Expand / Collapse events
  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 🔹 Status styling helpers
  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case "payée":
        return <Ionicons name="checkmark-circle" size={16} color="green" />;
      case "en attente":
        return <Ionicons name="time-outline" size={16} color="orange" />;
      case "annulée":
        return <Ionicons name="close-circle" size={16} color="red" />;
      default:
        return <Ionicons name="help-circle" size={16} color="gray" />;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "payée":
        return "green";
      case "en attente":
        return "orange";
      case "annulée":
        return "red";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔹 Sticky Header */}
      <View
        style={[
          styles.headerWrapper,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={{paddingHorizontal:10}}>
            <Header />
        </View>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.text}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un événement..."
            placeholderTextColor={colors.text + "80"}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* 🔹 Global totals */}
        <View style={[styles.globalTotals, { borderColor: colors.border }]}>
          <View style={styles.totalItem}>
            <Ionicons name="checkmark-circle" size={16} color="green" />
            <Text style={styles.totalText}>Payées : {globalTotals["payée"]}</Text>
          </View>
          <View style={styles.totalItem}>
            <Ionicons name="time-outline" size={16} color="orange" />
            <Text style={styles.totalText}>
              En attente : {globalTotals["en attente"]}
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Ionicons name="close-circle" size={16} color="red" />
            <Text style={styles.totalText}>
              Annulées : {globalTotals["annulée"]}
            </Text>
          </View>
        </View>
      </View>

      {/* 🔹 Scrollable Event List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredEvents.slice(0, visibleCount).map((event) => {
          const eventTickets = getTicketsForEvent(event.id);
          const subtotals = eventTickets.reduce(
            (acc, ticket) => {
              const facture = getFactureById(ticket.factureId);
              const etat = (facture?.etat || "inconnu") as TicketStatus;
              acc[etat] = (acc[etat] || 0) + 1;
              return acc;
            },
            { payée: 0, "en attente": 0, annulée: 0, inconnu: 0 } as Record<
              TicketStatus,
              number
            >
          );

          return (
            <View
              key={event.id}
              style={[
                styles.eventCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {/* 🔹 Event Header */}
              <TouchableOpacity
                onPress={() => toggleExpand(event.id)}
                style={styles.eventHeader}
                activeOpacity={0.7}
              >
                <Text style={[styles.eventTitle, { color: colors.text }]}>
                  {event.title || "Événement"}
                </Text>
                <Ionicons
                  name={expandedEvents[event.id] ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>

              <Text style={[styles.eventSub, { color: colors.text + "80" }]}>
                <Ionicons
                  name="ticket-outline"
                  size={14}
                  color={colors.text + "80"}
                />{" "}
                {eventTickets.length} ticket(s)
              </Text>

              {/* 🔹 Subtotals */}
              <View style={[styles.subTotals, { borderColor: colors.border }]}>
                {(Object.entries(subtotals) as [TicketStatus, number][]).map(([status, count]) => (
                    <View key={status} style={styles.subTotalItem}>
                        {getStatusIcon(status as TicketStatus)}
                        <Text style={[styles.subText, { color: colors.text }]}>{count}</Text>
                    </View>
                ))}

              </View>

              {/* 🔹 Collapsible tickets */}
              {expandedEvents[event.id] && (
                <View style={styles.ticketsContainer}>
                  {eventTickets.length > 0 ? (
                    eventTickets.map((ticket) => {
                      const facture = getFactureById(ticket.factureId);
                      const status = (facture?.etat || "inconnu") as TicketStatus;
                      return (
                        <View
                          key={ticket.id}
                          style={[styles.ticketItem, { borderColor: colors.border }]}
                        >
                          <View style={styles.ticketHeader}>
                            <Ionicons
                              name="receipt-outline"
                              size={16}
                              color={colors.text}
                            />
                            <Text
                              style={[styles.ticketText, { color: colors.text }]}
                            >
                              Facture: {ticket.factureId}
                            </Text>
                          </View>
                          <View style={styles.ticketDetails}>
                            <View style={styles.statusContainer}>
                              <Ionicons
                                name={
                                  status === "payée"
                                    ? "checkmark-circle"
                                    : status === "en attente"
                                    ? "time-outline"
                                    : status === "annulée"
                                    ? "close-circle"
                                    : "help-circle"
                                }
                                size={14}
                                color={getStatusColor(status)}
                              />
                              <Text
                                style={[
                                  styles.statusText,
                                  { color: getStatusColor(status) },
                                ]}
                              >
                                {facture?.etat || "—"}
                              </Text>
                            </View>
                            <View style={styles.dateContainer}>
                              <Ionicons
                                name="calendar-outline"
                                size={14}
                                color={colors.text + "80"}
                              />
                              <Text
                                style={[
                                  styles.ticketDate,
                                  { color: colors.text + "80" },
                                ]}
                              >
                                {ticket.createdAt
                                  ? new Date(
                                      ticket.createdAt.seconds * 1000
                                    ).toLocaleString()
                                  : "Non défini"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.noTicketContainer}>
                      <Ionicons
                        name="ticket-outline"
                        size={24}
                        color={colors.text + "50"}
                      />
                      <Text
                        style={[styles.noTicket, { color: colors.text + "50" }]}
                      >
                        Aucun ticket vendu
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* 🔹 Load More Button */}
        {visibleCount < filteredEvents.length && (
          <TouchableOpacity onPress={loadMore} style={styles.loadMoreBtn}>
            <Ionicons name="reload-outline" size={18} color="white" />
            <Text style={styles.loadMoreText}>Charger plus</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    paddingTop: 40,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 4, fontSize: 16 },
  globalTotals: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    marginHorizontal: 16,
  },
  totalItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  totalText: { fontSize: 14, fontWeight: "600" },
  scrollContent: { padding: 16, paddingBottom: 80 },
  eventCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventTitle: { fontSize: 18, fontWeight: "700", flex: 1, marginRight: 8 },
  eventSub: { fontSize: 14, marginBottom: 12 },
  subTotals: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 8,
  },
  subTotalItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  subText: { fontSize: 14, fontWeight: "600" },
  ticketsContainer: { marginTop: 12 },
  ticketItem: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginVertical: 6,
  },
  ticketHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  ticketText: { fontSize: 14, fontWeight: "500" },
  ticketDetails: { gap: 4 },
  statusContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusText: { fontSize: 13, fontWeight: "600" },
  dateContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  ticketDate: { fontSize: 12 },
  noTicketContainer: { alignItems: "center", padding: 20, gap: 8 },
  noTicket: { fontSize: 14, fontStyle: "italic" },
  loadMoreBtn: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: "center",
    width: "60%",
  },
  loadMoreText: { color: "white", fontSize: 16, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
});

export default TicketPayeeScreen;
