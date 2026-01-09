import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const resp = await login(emailOrUsername.trim(), password, recordar);

      // si requiere cambio password, luego lo conectamos a /cambiar-password
      if (resp.requiereCambioPassword) {
        // por ahora solo entramos, luego hacemos el flujo
      }

      nav("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(13,148,136,.35), transparent 60%), linear-gradient(135deg, #0EA5A4 0%, #10B981 100%)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          p: 3.5,
          bgcolor: "white",
          border: "1px solid rgba(255,255,255,.35)",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 24 }}>Sign In</Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
            Sign in to your account to continue.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 1.6 }}>
          <TextField
            label="Email / Username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
          />

          <FormControlLabel
            control={<Checkbox checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />}
            label="Remember me"
          />

          <Button type="submit" variant="contained" disabled={loading} sx={{ py: 1.2, borderRadius: 2 }}>
            {loading ? "Ingresando..." : "Login"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}