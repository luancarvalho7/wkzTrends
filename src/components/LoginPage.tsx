@@ .. @@
   return (
   )
-    <div className="min-h-screen bg-black flex items-center justify-center p-4">
+    <div className="min-h-screen bg-white flex items-center justify-center p-4">
       <div className="w-full max-w-md">
         <div className="text-center mb-8">
@@ .. @@
             className="h-8 mx-auto mb-6"
           />
-          <h1 className="text-2xl font-bold text-white">Work Smarter, not Harder!</h1>
-          <p className="text-gray-400 mt-2">Sign in to your account</p>
+          <h1 className="text-2xl font-bold text-gray-900">Work Smarter, not Harder!</h1>
+          <p className="text-gray-600 mt-2">Sign in to your account</p>
         </div>
 
@@ .. @@
           {error && (
)
}
-            <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg p-4 text-sm">
+            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
               {error}
             </div>
@@ .. @@
          <div>
-            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
+            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
               Email
             </label>
@@ .. @@
               value={email}
               onChange={(e) => setEmail(e.target.value)}
-              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
+              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
               placeholder="Enter your email"
               required
@@ .. @@
         <div>
-            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
+            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
               Password
             </label>
@@ .. @@
              value={password}
              onChange={(e) => setPassword(e.target.value)}
-              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
+              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
               placeholder="Enter your password"
               required
@@ .. @@
            type="submit"
             disabled={isLoading}
-            className="w-full bg-white text-black rounded-lg px-4 py-3 flex items-center justify-center space-x-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
+            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 flex items-center justify-center space-x-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >