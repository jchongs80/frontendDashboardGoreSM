import { Box, Chip, IconButton, Typography } from "@mui/material";
import Grid from "@mui/material/GridLegacy";

import StatCard from "../../components/ui/StatCard";
import SectionCard from "../../components/ui/SectionCard";

import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SubscriptionsOutlinedIcon from "@mui/icons-material/SubscriptionsOutlined";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";

import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/** Paleta tipo Vexel (TEAL) */
const C = {
  teal: "#0EA5A4",
  teal2: "#0D9488",
  dark: "#0F172A",
  muted: "#94A3B8",
  grid: "#E7ECF3",
  pie: ["#0EA5A4", "#38BDF8", "#F59E0B", "#22C55E"],
};

/** Datos demo */
const monthlyOrders = [
  { m: "Aug", online: 45, offline: 75, marketing: 35 },
  { m: "Sep", online: 55, offline: 85, marketing: 40 },
  { m: "Oct", online: 58, offline: 100, marketing: 36 },
  { m: "Nov", online: 56, offline: 98, marketing: 26 },
  { m: "Dec", online: 60, offline: 88, marketing: 44 },
  { m: "Jan", online: 58, offline: 105, marketing: 48 },
  { m: "Feb", online: 64, offline: 92, marketing: 52 },
  { m: "Mar", online: 60, offline: 115, marketing: 54 },
  { m: "Apr", online: 66, offline: 95, marketing: 40 },
];

const revenueSpark = [
  { x: 1, y: 12 },
  { x: 2, y: 9 },
  { x: 3, y: 14 },
  { x: 4, y: 8 },
  { x: 5, y: 16 },
  { x: 6, y: 11 },
  { x: 7, y: 18 },
  { x: 8, y: 13 },
];

const leads = [
  { name: "Mobile", value: 1624 },
  { name: "Desktop", value: 1267 },
  { name: "Laptop", value: 1153 },
  { name: "Tablet", value: 679 },
];

const bestProducts = [
  { product: "White headphones", category: "Gadgets", sold: 457, price: 97, earnings: 74890 },
  { product: "Mini Alarm", category: "Fashion", sold: 876, price: 97, earnings: 74890 },
  { product: "Camera-Lenses", category: "Smart Home", sold: 432, price: 97, earnings: 74890 },
  { product: "Photo Frame", category: "Bags", sold: 234, price: 97, earnings: 74890 },
];

export default function Home() {
  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 900, color: "text.primary" }}>
          Dashboard
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
          Admin / Dashboard
        </Typography>
      </Box>

      <Grid container spacing={2.2}>
        {/* LEFT COLUMN (como Vexel): stats pequeñas + cards medianas + recent */}
        <Grid item xs={12} lg={3}>
          <Grid container spacing={2.2}>
            <Grid item xs={12}>
              <StatCard
                icon={<ShoppingBagOutlinedIcon />}
                label="Total Orders"
                value="45"
                delta={{ text: "+0.5%", positive: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <StatCard
                icon={<Inventory2OutlinedIcon />}
                label="Total Package"
                value="10"
                delta={{ text: "-8.0%", positive: false }}
              />
            </Grid>

            <Grid item xs={12}>
              <StatCard
                icon={<PaymentsOutlinedIcon />}
                label="Total Payments"
                value="60"
                delta={{ text: "+3.5%", positive: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <StatCard
                icon={<SubscriptionsOutlinedIcon />}
                label="Subscriptions"
                value="10"
                delta={{ text: "+0.5%", positive: true }}
              />
            </Grid>

            {/* Total Sales by Unit (card más grande tipo Vexel) */}
            <Grid item xs={12}>
              <SectionCard title="Total Sales by Unit">
                <Typography sx={{ fontSize: 22, fontWeight: 900 }}>$12,897</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 12.5, color: "warning.main", fontWeight: 800 }}>
                  -3.5%
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                      Active Sales
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>3,274</Typography>
                  </Box>

                  <Box
                    sx={{
                      mt: 1,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: C.grid,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: "55%",
                        height: "100%",
                        backgroundColor: "warning.main",
                      }}
                    />
                  </Box>

                  <Typography
                    sx={{
                      mt: 2,
                      fontSize: 12.5,
                      color: C.teal,
                      fontWeight: 900,
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    View Details ↗
                  </Typography>
                </Box>
              </SectionCard>
            </Grid>

            {/* Total Revenue (card con mini chart) */}
            <Grid item xs={12}>
              <SectionCard title="Total Revenue">
                <Typography sx={{ fontSize: 22, fontWeight: 900 }}>$8,889</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 12.5, color: "success.main", fontWeight: 800 }}>
                  +5.5%
                </Typography>

                <Box sx={{ height: 120, mt: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueSpark}>
                      <Tooltip />
                      <Line type="monotone" dataKey="y" stroke={C.teal} strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </SectionCard>
            </Grid>

            {/* Recent Activities */}
            <Grid item xs={12}>
              <SectionCard title="Recent Activities">
                {[
                  { title: "Nile Robetz mentioned a job in post", sub: "Uploaded a new post", time: "11:17 am" },
                  { title: "Always look on the bright side of life", sub: "Look at The Life", time: "08:19 am" },
                  { title: "Peace on earth a wonderful width", sub: "Wonderful earth gives a peace", time: "10:43 am" },
                  { title: "A brief history of creation", sub: "Create your own history", time: "07:27 pm" },
                ].map((x, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 1,
                      py: 1.1,
                      borderBottom: i === 3 ? "none" : "1px solid #F0F3F8",
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 13.2, fontWeight: 900 }}>{x.title}</Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{x.sub}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", whiteSpace: "nowrap" }}>
                      {x.time}
                    </Typography>
                  </Box>
                ))}
              </SectionCard>
            </Grid>
          </Grid>
        </Grid>

        {/* CENTER COLUMN: Monthly Orders Analytics + Best Selling Products */}
        <Grid item xs={12} lg={6}>
          <Grid container spacing={2.2}>
            <Grid item xs={12}>
              <SectionCard
                title="Monthly Orders Analytics"
                action={
                  <Chip
                    size="small"
                    label="View All"
                    sx={{
                      bgcolor: "rgba(14,165,164,0.10)",
                      color: C.teal,
                      fontWeight: 900,
                    }}
                  />
                }
              >
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyOrders}>
                      <XAxis dataKey="m" />
                      <Tooltip />
                      <Bar dataKey="online" fill={C.dark} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="offline" fill={C.teal} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="marketing" fill="#B38B52" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Chip size="small" label="Online" />
                  <Chip size="small" label="Offline" />
                  <Chip size="small" label="Marketing" />
                </Box>
              </SectionCard>
            </Grid>

            <Grid item xs={12}>
              <SectionCard
                title="Best Selling Products"
                action={
                  <Chip
                    size="small"
                    label="View All"
                    sx={{
                      bgcolor: "rgba(14,165,164,0.10)",
                      color: C.teal,
                      fontWeight: 900,
                    }}
                  />
                }
              >
                <Box sx={{ display: "grid", gap: 1.2 }}>
                  {/* Header */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1.1fr 0.8fr 0.8fr 1fr",
                      gap: 1,
                      fontSize: 12,
                      color: "text.secondary",
                      fontWeight: 900,
                      px: 1,
                    }}
                  >
                    <Box>Products</Box>
                    <Box>Categories</Box>
                    <Box>Sold</Box>
                    <Box>Price</Box>
                    <Box>Earnings</Box>
                  </Box>

                  {/* Rows */}
                  {bestProducts.map((r, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1.1fr 0.8fr 0.8fr 1fr",
                        gap: 1,
                        alignItems: "center",
                        px: 1,
                        py: 1.1,
                        borderTop: "1px solid #F0F3F8",
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{r.product}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>{r.category}</Typography>
                      <Chip
                        size="small"
                        label={r.sold}
                        sx={{ width: "fit-content", bgcolor: "rgba(14,165,164,0.12)", color: C.teal, fontWeight: 900 }}
                      />
                      <Typography sx={{ fontWeight: 900 }}>${r.price}</Typography>
                      <Typography sx={{ fontWeight: 900 }}>${r.earnings.toLocaleString()}</Typography>
                    </Box>
                  ))}
                </Box>
              </SectionCard>
            </Grid>
          </Grid>
        </Grid>

        {/* RIGHT COLUMN: Top Sellers + mini cards + categories + donut */}
        <Grid item xs={12} lg={3}>
          <Grid container spacing={2.2}>
            {/* Top Sellers teal card */}
            <Grid item xs={12}>
              <Box
                sx={{
                  borderRadius: 3,
                  p: 2.2,
                  color: "white",
                  background: "linear-gradient(135deg, #0EA5A4 0%, #0D9488 55%, #0B7F7C 100%)",
                  boxShadow: "0 18px 32px rgba(14,165,164,0.22)",
                  minHeight: 140,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Typography sx={{ fontWeight: 900, fontSize: 15, mb: 0.5 }}>
                  Top Sellers of this Week
                </Typography>
                <Typography sx={{ opacity: 0.9, fontSize: 12.5 }}>
                  You have got 5 new offers, Track here the Sales data and best deals here.
                </Typography>

                <Box sx={{ mt: 1.4, display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 900 }}>3,531</Typography>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 900, opacity: 0.95 }}>+0.5%</Typography>
                </Box>

                <Box
                  sx={{
                    position: "absolute",
                    right: -28,
                    top: -28,
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    border: "18px solid rgba(255,255,255,0.14)",
                  }}
                />
              </Box>
            </Grid>

            {/* Mini cards */}
            <Grid item xs={12} sm={6} lg={12}>
              <SectionCard title="Total Projects">
                <Typography sx={{ fontSize: 22, fontWeight: 900 }}>60</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 12.5, color: "success.main", fontWeight: 800 }}>
                  +8.0%
                </Typography>
              </SectionCard>
            </Grid>

            <Grid item xs={12} sm={6} lg={12}>
              <SectionCard title="Completed Projects">
                <Typography sx={{ fontSize: 22, fontWeight: 900 }}>40</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 12.5, color: "error.main", fontWeight: 800 }}>
                  -4.0%
                </Typography>
              </SectionCard>
            </Grid>

            {/* Top Product Categories */}
            <Grid item xs={12}>
              <SectionCard
                title="Top Product Categories"
                action={
                  <Chip
                    size="small"
                    label="View All"
                    sx={{
                      bgcolor: "rgba(14,165,164,0.10)",
                      color: C.teal,
                      fontWeight: 900,
                    }}
                  />
                }
              >
                {[
                  { name: "Women's Clothing", desc: "Different types of clothing", qty: "40 available" },
                  { name: "Phones and Tablets", desc: "All models of phones", qty: "60 available" },
                  { name: "Electronics", desc: "Related to all Electronics", qty: "70 available" },
                  { name: "Home Appliances", desc: "Furnitures,gadgets etc.", qty: "80 available" },
                ].map((x, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1.1,
                      borderBottom: idx === 3 ? "none" : "1px solid #F0F3F8",
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 900, fontSize: 13.2 }}>{x.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{x.desc}</Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={x.qty}
                      sx={{
                        bgcolor: "rgba(14,165,164,0.10)",
                        color: C.teal,
                        fontWeight: 900,
                      }}
                    />
                  </Box>
                ))}
              </SectionCard>
            </Grid>

            {/* Leads donut (opcional, para tener un widget más) */}
            <Grid item xs={12}>
              <SectionCard
                title="Leads By Source"
                action={
                  <IconButton size="small">
                    <MoreVertRoundedIcon />
                  </IconButton>
                }
              >
                <Box sx={{ height: 220, display: "grid", placeItems: "center" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leads} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={2}>
                        {leads.map((_, idx) => (
                          <Cell key={idx} fill={C.pie[idx % C.pie.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                <Grid container spacing={1} sx={{ mt: 1 }}>
                  {leads.map((x) => (
                    <Grid item xs={6} key={x.name}>
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{x.name}</Typography>
                      <Typography sx={{ fontWeight: 900 }}>{x.value.toLocaleString()}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </SectionCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}